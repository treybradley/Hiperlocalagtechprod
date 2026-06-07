import { useState, useRef, useEffect } from 'react';
import { LogOut, Users, Mail, Loader, X, ChevronDown, Crown, UserCheck, Trash2 } from 'lucide-react';
import { useAuth, Farm } from '../contexts/AuthContext';

export function UserMenu() {
  const { profile, farm, signOut, inviteMember, removeMember, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<Farm['members']>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'collaborator' | 'admin'>('collaborator');
  const [inviting, setInviting] = useState(false);
  const [inviteState, setInviteState] = useState<'idle' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function loadMembers() {
    if (!farm) return;
    setLoadingMembers(true);
    try {
      const { supabase } = await import('../contexts/AuthContext');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `https://${(await import('/utils/supabase/info')).projectId}.supabase.co/functions/v1/make-server-4f58e216/farms/${farm.id}/members`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setMembers(await res.json());
    } catch (e) {
      console.log('Error loading members:', e);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteState('idle');
    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteState('sent');
      setInviteEmail('');
      setTimeout(() => setInviteState('idle'), 4000);
    } catch (err: any) {
      setInviteError(err.message ?? 'Failed to invite');
      setInviteState('error');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    await removeMember(userId);
    await loadMembers();
  }

  const isAdmin = profile?.role === 'admin';
  const initials = profile?.name ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[10px] text-green-400 font-medium">
          {initials}
        </div>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[300]">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-white text-sm font-medium">{profile?.name}</div>
            <div className="text-white/40 text-xs">{profile?.email}</div>
            {farm && <div className="text-white/30 text-[10px] mt-0.5 flex items-center gap-1"><span className="text-green-500/60">●</span> {farm.name}</div>}
          </div>

          {/* Actions */}
          <div className="py-1">
            {isAdmin && farm && (
              <>
                <button
                  onClick={() => { setShowInvite(true); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm text-left"
                >
                  <Mail className="w-4 h-4" />
                  Invite collaborator
                </button>
                <button
                  onClick={() => { setShowMembers(true); setOpen(false); loadMembers(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm text-left"
                >
                  <Users className="w-4 h-4" />
                  Manage members
                </button>
                <div className="h-px bg-white/5 my-1" />
              </>
            )}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-light text-lg">Invite collaborator</h3>
              <button onClick={() => { setShowInvite(false); setInviteState('idle'); }} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  autoFocus
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-green-500/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">Role</label>
                <div className="flex gap-2 mt-1">
                  {(['collaborator', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`flex-1 py-2 rounded-lg border text-xs transition-all capitalize ${inviteRole === r ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}
                    >
                      {r === 'admin' ? <><Crown className="w-3 h-3 inline mr-1" />Admin</> : <><UserCheck className="w-3 h-3 inline mr-1" />Collaborator</>}
                    </button>
                  ))}
                </div>
                <p className="text-white/25 text-[10px] mt-1">{inviteRole === 'admin' ? 'Can manage all systems and invite others' : 'Can log data and view all systems'}</p>
              </div>

              {inviteState === 'sent' && (
                <div className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  Invite sent! They'll receive a magic link by email.
                </div>
              )}
              {inviteState === 'error' && <p className="text-red-400 text-xs">{inviteError}</p>}

              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 disabled:opacity-40 transition-all text-sm"
              >
                {inviting ? <Loader className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send invite</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-light text-lg">Farm members</h3>
              <button onClick={() => setShowMembers(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
            </div>
            {loadingMembers ? (
              <div className="flex justify-center py-6"><Loader className="w-5 h-5 animate-spin text-white/30" /></div>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[10px] text-green-400">
                      {(m.profile?.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate">{m.profile?.name ?? 'Unknown'}</div>
                      <div className="text-white/30 text-[10px] truncate">{m.profile?.email ?? ''}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${m.role === 'admin' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-white/10 text-white/40'}`}>
                      {m.role}
                    </span>
                    {m.userId !== profile?.id && (
                      <button onClick={() => handleRemove(m.userId)} className="text-white/20 hover:text-red-400 transition-colors ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {members.length === 0 && <p className="text-white/30 text-xs text-center py-4">No members yet.</p>}
              </div>
            )}
            <button
              onClick={() => { setShowMembers(false); setShowInvite(true); }}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/8 hover:text-white transition-all text-sm"
            >
              <Mail className="w-4 h-4" /> Invite someone new
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
