import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function UserMenu() {
  const { user, session, signOut, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!session || !user) {
    return (
      <button
        onClick={() => openAuthModal()}
        className="px-3 py-1.5 text-[12px] text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-full transition-all"
      >
        {t('auth.signIn')}
      </button>
    );
  }

  const email = user.email ?? '';
  const initial = email ? email.charAt(0).toUpperCase() : '?';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[10px] text-green-400 font-medium">
          {initial}
        </div>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[300]">
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-white/40 text-xs truncate">{email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm text-left"
          >
            <LogOut className="w-4 h-4" />
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
