/** Ambient types for Supabase Edge Functions (Deno runtime). IDE-only — not used at deploy time. */

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }

  function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string; onListen?: (params: { port: number }) => void },
  ): { shutdown: () => Promise<void> };
}

declare module "jsr:*";
declare module "npm:*";
