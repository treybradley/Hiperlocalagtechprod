import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.ts";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PHOTO_BUCKET = "make-4f58e216-photos";

// Ensure photo bucket exists on startup
(async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === PHOTO_BUCKET);
  if (!bucketExists) {
    await supabase.storage.createBucket(PHOTO_BUCKET);
  }
})();

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const BASE = "/make-server-4f58e216";

async function getAuthUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    console.log("getAuthUser: missing SUPABASE_URL or SUPABASE_ANON_KEY");
    return null;
  }

  const token = authHeader.slice(7);
  if (token === anonKey) return null;

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    console.log("getAuthUser error:", error?.message);
    return null;
  }
  return user as { id: string; email?: string };
}

function ownedBy(record: any, userId: string): boolean {
  if (!record) return false;
  // Legacy records saved before user scoping may lack userId
  if (!record.userId) return true;
  return record.userId === userId;
}

function filterByUser(items: any[], userId: string): any[] {
  return items.filter((item) => ownedBy(item, userId));
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ── Systems ───────────────────────────────────────────────────────────────────
app.get(`${BASE}/systems`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const items = filterByUser(await kv.getByPrefix("sys:"), user.id);
    return c.json(items);
  } catch (e) {
    console.log("Error listing systems:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${BASE}/systems/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const val = await kv.get(`sys:${c.req.param("id")}`);
    if (!val || !ownedBy(val, user.id)) return c.json({ error: "System not found" }, 404);
    return c.json(val);
  } catch (e) {
    console.log("Error getting system:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${BASE}/systems`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const now = Date.now();
    const system = {
      ...body,
      userId: user.id,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      totalCycles: 0,
    };
    await kv.set(`sys:${system.id}`, system);
    return c.json(system, 201);
  } catch (e) {
    console.log("Error creating system:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.put(`${BASE}/systems/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`sys:${id}`);
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "System not found" }, 404);
    const updates = await c.req.json();
    const updated = {
      ...existing as object,
      ...updates,
      userId: user.id,
      id,
      createdAt: (existing as any).createdAt,
      updatedAt: Date.now(),
    };
    await kv.set(`sys:${id}`, updated);
    return c.json(updated);
  } catch (e) {
    console.log("Error updating system:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${BASE}/systems/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`sys:${id}`);
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "System not found" }, 404);
    const cycles = filterByUser(await kv.getByPrefix("cyc:") as any[], user.id);
    const hasCycles = cycles.some((cy: any) => cy.systemId === id);
    if (hasCycles) return c.json({ error: "Cannot delete system with existing grow cycles" }, 400);
    await kv.del(`sys:${id}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log("Error deleting system:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ── Grow Cycles ───────────────────────────────────────────────────────────────
app.get(`${BASE}/grow-cycles`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const systemId = c.req.query("systemId");
    const status = c.req.query("status");
    let items = filterByUser(await kv.getByPrefix("cyc:") as any[], user.id);
    if (systemId) items = items.filter((cy) => cy.systemId === systemId);
    if (status) items = items.filter((cy) => cy.status === status);
    return c.json(items);
  } catch (e) {
    console.log("Error listing grow cycles:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${BASE}/grow-cycles/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const val = await kv.get(`cyc:${c.req.param("id")}`);
    if (!val || !ownedBy(val, user.id)) return c.json({ error: "Grow cycle not found" }, 404);
    return c.json(val);
  } catch (e) {
    console.log("Error getting grow cycle:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${BASE}/grow-cycles`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const sys = await kv.get(`sys:${body.systemId}`) as any;
    if (!sys || !ownedBy(sys, user.id)) return c.json({ error: "System not found" }, 404);
    const now = Date.now();
    const cycle = {
      ...body,
      userId: user.id,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      dailyLogCount: 0,
      photoCount: 0,
      issueCount: 0,
      resolvedIssueCount: 0,
    };
    await kv.set(`cyc:${cycle.id}`, cycle);

    await kv.set(`sys:${body.systemId}`, {
      ...sys,
      totalCycles: (sys.totalCycles ?? 0) + 1,
      activeCycleId: cycle.id,
      updatedAt: now,
    });

    return c.json(cycle, 201);
  } catch (e) {
    console.log("Error creating grow cycle:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.put(`${BASE}/grow-cycles/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`cyc:${id}`);
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "Grow cycle not found" }, 404);
    const updates = await c.req.json();
    const updated = {
      ...existing as object,
      ...updates,
      userId: user.id,
      id,
      createdAt: (existing as any).createdAt,
      updatedAt: Date.now(),
    };
    await kv.set(`cyc:${id}`, updated);
    return c.json(updated);
  } catch (e) {
    console.log("Error updating grow cycle:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${BASE}/grow-cycles/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`cyc:${id}`) as any;
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "Grow cycle not found" }, 404);

    const allLogs = filterByUser(await kv.getByPrefix("log:") as any[], user.id);
    const cycleLogs = allLogs.filter((l) => l.growCycleId === id);
    for (const log of cycleLogs) {
      await kv.del(`log:${log.id}`);
    }

    const allPhotos = filterByUser(await kv.getByPrefix("pho:") as any[], user.id);
    const cyclePhotos = allPhotos.filter((p) => p.growCycleId === id);
    const storagePaths = cyclePhotos
      .map((p) => p.storagePath)
      .filter((path): path is string => Boolean(path));
    if (storagePaths.length > 0) {
      await supabase.storage.from(PHOTO_BUCKET).remove(storagePaths);
    }
    for (const photo of cyclePhotos) {
      await kv.del(`pho:${photo.id}`);
    }

    await kv.del(`cyc:${id}`);

    const sys = await kv.get(`sys:${existing.systemId}`) as any;
    if (sys && ownedBy(sys, user.id)) {
      const updated: Record<string, unknown> = {
        ...sys,
        totalCycles: Math.max(0, (sys.totalCycles ?? 0) - 1),
        updatedAt: Date.now(),
      };
      if (sys.activeCycleId === id) {
        updated.activeCycleId = undefined;
      }
      await kv.set(`sys:${existing.systemId}`, updated);
    }

    return c.json({ ok: true });
  } catch (e) {
    console.log("Error deleting grow cycle:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ── Daily Logs ────────────────────────────────────────────────────────────────
app.get(`${BASE}/daily-logs`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const growCycleId = c.req.query("growCycleId");
    const systemId = c.req.query("systemId");
    let items = filterByUser(await kv.getByPrefix("log:") as any[], user.id);
    if (growCycleId) items = items.filter((l) => l.growCycleId === growCycleId);
    if (systemId) items = items.filter((l) => l.systemId === systemId);
    items.sort((a, b) => b.timestamp - a.timestamp);
    return c.json(items);
  } catch (e) {
    console.log("Error listing daily logs:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${BASE}/daily-logs/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const val = await kv.get(`log:${c.req.param("id")}`);
    if (!val || !ownedBy(val, user.id)) return c.json({ error: "Daily log not found" }, 404);
    return c.json(val);
  } catch (e) {
    console.log("Error getting daily log:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${BASE}/daily-logs`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const cycle = await kv.get(`cyc:${body.growCycleId}`) as any;
    if (!cycle || !ownedBy(cycle, user.id)) return c.json({ error: "Grow cycle not found" }, 404);
    const now = Date.now();
    const log = {
      ...body,
      userId: user.id,
      id: crypto.randomUUID(),
      createdAt: now,
    };
    await kv.set(`log:${log.id}`, log);

    await kv.set(`cyc:${body.growCycleId}`, {
      ...cycle,
      dailyLogCount: (cycle.dailyLogCount ?? 0) + 1,
      updatedAt: now,
    });

    return c.json(log, 201);
  } catch (e) {
    console.log("Error creating daily log:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.put(`${BASE}/daily-logs/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`log:${id}`);
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "Daily log not found" }, 404);
    const updates = await c.req.json();
    const updated = {
      ...existing as object,
      ...updates,
      userId: user.id,
      id,
      createdAt: (existing as any).createdAt,
    };
    await kv.set(`log:${id}`, updated);
    return c.json(updated);
  } catch (e) {
    console.log("Error updating daily log:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${BASE}/daily-logs/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`log:${id}`) as any;
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "Daily log not found" }, 404);

    const allPhotos = filterByUser(await kv.getByPrefix("pho:") as any[], user.id);
    const logPhotos = allPhotos.filter((p) => p.dailyLogId === id);
    const storagePaths = logPhotos
      .map((p) => p.storagePath)
      .filter((path): path is string => Boolean(path));
    if (storagePaths.length > 0) {
      await supabase.storage.from(PHOTO_BUCKET).remove(storagePaths);
    }
    for (const photo of logPhotos) {
      await kv.del(`pho:${photo.id}`);
    }

    await kv.del(`log:${id}`);

    const cycle = await kv.get(`cyc:${existing.growCycleId}`) as any;
    if (cycle && ownedBy(cycle, user.id)) {
      const logIssues = existing.issues ?? [];
      const issueCount = logIssues.length;
      const resolvedCount = logIssues.filter((i: { resolved: boolean }) => i.resolved).length;
      await kv.set(`cyc:${existing.growCycleId}`, {
        ...cycle,
        dailyLogCount: Math.max(0, (cycle.dailyLogCount ?? 0) - 1),
        issueCount: Math.max(0, (cycle.issueCount ?? 0) - issueCount),
        resolvedIssueCount: Math.max(0, (cycle.resolvedIssueCount ?? 0) - resolvedCount),
        photoCount: Math.max(0, (cycle.photoCount ?? 0) - logPhotos.length),
        updatedAt: Date.now(),
      });
    }

    return c.json({ ok: true });
  } catch (e) {
    console.log("Error deleting daily log:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ── Photos ────────────────────────────────────────────────────────────────────
app.get(`${BASE}/photos`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const growCycleId = c.req.query("growCycleId");
    const systemId = c.req.query("systemId");
    const dailyLogId = c.req.query("dailyLogId");
    let items = filterByUser(await kv.getByPrefix("pho:") as any[], user.id);
    if (growCycleId) items = items.filter((p) => p.growCycleId === growCycleId);
    if (systemId) items = items.filter((p) => p.systemId === systemId);
    if (dailyLogId) items = items.filter((p) => p.dailyLogId === dailyLogId);
    items.sort((a, b) => b.timestamp - a.timestamp);

    const withUrls = await Promise.all(
      items.map(async (photo) => {
        if (photo.storagePath) {
          const { data } = await supabase.storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(photo.storagePath, 3600);
          return { ...photo, signedUrl: data?.signedUrl };
        }
        return photo;
      })
    );
    return c.json(withUrls);
  } catch (e) {
    console.log("Error listing photos:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${BASE}/photos/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const val = await kv.get(`pho:${c.req.param("id")}`) as any;
    if (!val || !ownedBy(val, user.id)) return c.json({ error: "Photo not found" }, 404);
    if (val.storagePath) {
      const { data } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(val.storagePath, 3600);
      return c.json({ ...val, signedUrl: data?.signedUrl });
    }
    return c.json(val);
  } catch (e) {
    console.log("Error getting photo:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${BASE}/photos`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const cycle = await kv.get(`cyc:${body.growCycleId}`) as any;
    if (!cycle || !ownedBy(cycle, user.id)) return c.json({ error: "Grow cycle not found" }, 404);
    const now = Date.now();
    const id = crypto.randomUUID();

    let storagePath: string | undefined;
    let signedUrl: string | undefined;

    if (body.imageData) {
      const base64 = body.imageData.replace(/^data:[^;]+;base64,/, "");
      const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      storagePath = `${body.growCycleId}/${id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, buffer, { contentType: "image/jpeg" });
      if (uploadError) {
        console.log("Storage upload error:", uploadError);
        return c.json({ error: `Storage upload error: ${uploadError.message}` }, 500);
      }
      const { data } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(storagePath, 3600);
      signedUrl = data?.signedUrl;
    }

    const photo = {
      ...body,
      userId: user.id,
      id,
      createdAt: now,
      imageData: undefined,
      storagePath,
    };
    await kv.set(`pho:${id}`, photo);

    await kv.set(`cyc:${body.growCycleId}`, {
      ...cycle,
      photoCount: (cycle.photoCount ?? 0) + 1,
      updatedAt: now,
    });

    return c.json({ ...photo, signedUrl }, 201);
  } catch (e) {
    console.log("Error creating photo:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${BASE}/photos/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const photo = await kv.get(`pho:${id}`) as any;
    if (!photo || !ownedBy(photo, user.id)) return c.json({ error: "Photo not found" }, 404);
    if (photo.storagePath) {
      await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath]);
    }
    await kv.del(`pho:${id}`);

    if (photo.dailyLogId) {
      const log = await kv.get(`log:${photo.dailyLogId}`) as any;
      if (log && ownedBy(log, user.id)) {
        await kv.set(`log:${photo.dailyLogId}`, {
          ...log,
          photoIds: (log.photoIds ?? []).filter((pid: string) => pid !== id),
        });
      }
    }

    if (photo.growCycleId) {
      const cycle = await kv.get(`cyc:${photo.growCycleId}`) as any;
      if (cycle && ownedBy(cycle, user.id)) {
        await kv.set(`cyc:${photo.growCycleId}`, {
          ...cycle,
          photoCount: Math.max(0, (cycle.photoCount ?? 0) - 1),
          updatedAt: Date.now(),
        });
      }
    }

    return c.json({ ok: true });
  } catch (e) {
    console.log("Error deleting photo:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ── Auth / User Profiles (legacy — unused in MVP) ─────────────────────────────

// Get current user profile
app.get(`${BASE}/auth/me`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const profile = await kv.get(`usr:${user.id}`);
    return c.json(profile ?? null);
  } catch (e) {
    console.log("Error getting profile:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Create or update user profile
app.post(`${BASE}/auth/profile`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const now = Date.now();
    const existing = await kv.get(`usr:${user.id}`) as any;
    const profile = {
      id: user.id,
      email: user.email,
      name: body.name ?? existing?.name ?? "",
      role: existing?.role ?? body.role ?? "admin",
      farmId: existing?.farmId ?? body.farmId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await kv.set(`usr:${user.id}`, profile);
    return c.json(profile);
  } catch (e) {
    console.log("Error saving profile:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ── Farms ─────────────────────────────────────────────────────────────────────

// Create farm
app.post(`${BASE}/farms`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const now = Date.now();
    const farm = {
      id: crypto.randomUUID(),
      name: body.name,
      adminId: user.id,
      members: [{ userId: user.id, role: "admin" }],
      createdAt: now,
      updatedAt: now,
    };
    await kv.set(`frm:${farm.id}`, farm);
    // Update user profile with farmId + admin role
    const profile = await kv.get(`usr:${user.id}`) as any;
    if (profile) {
      await kv.set(`usr:${user.id}`, { ...profile, farmId: farm.id, role: "admin", updatedAt: now });
    }
    return c.json(farm, 201);
  } catch (e) {
    console.log("Error creating farm:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Get farm
app.get(`${BASE}/farms/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const farm = await kv.get(`frm:${c.req.param("id")}`);
    if (!farm) return c.json({ error: "Farm not found" }, 404);
    return c.json(farm);
  } catch (e) {
    console.log("Error getting farm:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// List farm members (with profile data)
app.get(`${BASE}/farms/:id/members`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const farm = await kv.get(`frm:${c.req.param("id")}`) as any;
    if (!farm) return c.json({ error: "Farm not found" }, 404);
    const members = await Promise.all(
      (farm.members ?? []).map(async (m: any) => {
        const profile = await kv.get(`usr:${m.userId}`);
        return { ...m, profile };
      })
    );
    return c.json(members);
  } catch (e) {
    console.log("Error listing members:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Invite a collaborator — sends magic link via Supabase
app.post(`${BASE}/farms/:id/invite`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const farmId = c.req.param("id");
    const farm = await kv.get(`frm:${farmId}`) as any;
    if (!farm) return c.json({ error: "Farm not found" }, 404);
    if (farm.adminId !== user.id) return c.json({ error: "Only admin can invite" }, 403);
    const { email, role = "collaborator" } = await c.req.json();
    if (!email) return c.json({ error: "Email required" }, 400);
    const now = Date.now();
    const token = crypto.randomUUID();
    const invite = { token, farmId, farmName: farm.name, invitedBy: user.id, email, role, createdAt: now, expiresAt: now + 7 * 24 * 60 * 60 * 1000 };
    await kv.set(`inv:${token}`, invite);
    // Send magic link via Supabase (invite user — creates account if needed)
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { inviteToken: token, farmId, role },
    });
    if (error) {
      console.log("Supabase invite error:", error);
      return c.json({ error: `Invite email error: ${error.message}` }, 500);
    }
    return c.json({ ok: true, token });
  } catch (e) {
    console.log("Error inviting member:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Remove a member
app.delete(`${BASE}/farms/:id/members/:userId`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const farmId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    const farm = await kv.get(`frm:${farmId}`) as any;
    if (!farm) return c.json({ error: "Farm not found" }, 404);
    if (farm.adminId !== user.id) return c.json({ error: "Only admin can remove members" }, 403);
    if (targetUserId === user.id) return c.json({ error: "Cannot remove yourself" }, 400);
    const now = Date.now();
    const updated = { ...farm, members: farm.members.filter((m: any) => m.userId !== targetUserId), updatedAt: now };
    await kv.set(`frm:${farmId}`, updated);
    // Clear farmId from removed user's profile
    const profile = await kv.get(`usr:${targetUserId}`) as any;
    if (profile) await kv.set(`usr:${targetUserId}`, { ...profile, farmId: null, updatedAt: now });
    return c.json({ ok: true });
  } catch (e) {
    console.log("Error removing member:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Accept invite (called after magic link login with inviteToken in user metadata)
app.post(`${BASE}/auth/accept-invite`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { token } = await c.req.json();
    const invite = await kv.get(`inv:${token}`) as any;
    if (!invite) return c.json({ error: "Invite not found or expired" }, 404);
    if (invite.expiresAt < Date.now()) return c.json({ error: "Invite expired" }, 410);
    const now = Date.now();
    const farm = await kv.get(`frm:${invite.farmId}`) as any;
    if (!farm) return c.json({ error: "Farm not found" }, 404);
    // Add member if not already present
    const alreadyMember = farm.members.some((m: any) => m.userId === user.id);
    if (!alreadyMember) {
      farm.members.push({ userId: user.id, role: invite.role });
      await kv.set(`frm:${invite.farmId}`, { ...farm, updatedAt: now });
    }
    // Update user profile
    const profile = await kv.get(`usr:${user.id}`) as any ?? {};
    await kv.set(`usr:${user.id}`, { ...profile, id: user.id, farmId: invite.farmId, role: invite.role, updatedAt: now });
    await kv.del(`inv:${token}`);
    return c.json({ ok: true, farmId: invite.farmId, role: invite.role });
  } catch (e) {
    console.log("Error accepting invite:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// ── Financial Plans ───────────────────────────────────────────────────────────
app.get(`${BASE}/financial-plans`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const items = filterByUser(await kv.getByPrefix("pln:"), user.id);
    return c.json(items);
  } catch (e) {
    console.log("Error listing financial plans:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${BASE}/financial-plans/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const val = await kv.get(`pln:${c.req.param("id")}`);
    if (!val || !ownedBy(val, user.id)) return c.json({ error: "Financial plan not found" }, 404);
    return c.json(val);
  } catch (e) {
    console.log("Error getting financial plan:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${BASE}/financial-plans`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const now = Date.now();
    const plan = {
      ...body,
      userId: user.id,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await kv.set(`pln:${plan.id}`, plan);
    return c.json(plan, 201);
  } catch (e) {
    console.log("Error creating financial plan:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.put(`${BASE}/financial-plans/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`pln:${id}`);
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "Financial plan not found" }, 404);
    const updates = await c.req.json();
    const updated = {
      ...existing as object,
      ...updates,
      userId: user.id,
      id,
      createdAt: (existing as any).createdAt,
      updatedAt: Date.now(),
    };
    await kv.set(`pln:${id}`, updated);
    return c.json(updated);
  } catch (e) {
    console.log("Error updating financial plan:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${BASE}/financial-plans/:id`, async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const id = c.req.param("id");
    const existing = await kv.get(`pln:${id}`);
    if (!existing || !ownedBy(existing, user.id)) return c.json({ error: "Financial plan not found" }, 404);
    await kv.del(`pln:${id}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log("Error deleting financial plan:", e);
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);
