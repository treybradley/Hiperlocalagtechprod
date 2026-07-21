import { useState } from 'react';
import { Leaf, LayoutGrid, BookOpen, Info, Menu, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LanguageToggle } from './LanguageToggle';
import { UserMenu } from './UserMenu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

interface TopNavigationProps {
  mode: 'planning' | 'operations' | 'about' | 'learn';
  onModeChange: (mode: 'planning' | 'operations' | 'about' | 'learn') => void;
}

type AppMode = TopNavigationProps['mode'];

const navItems: { mode: AppMode; labelKey: string; fallback: string; icon: typeof Leaf }[] = [
  { mode: 'planning', labelKey: 'nav.planning', fallback: 'Ideation', icon: Leaf },
  { mode: 'operations', labelKey: 'nav.operations', fallback: 'Operations', icon: LayoutGrid },
  { mode: 'learn', labelKey: 'nav.learn', fallback: 'Learn', icon: BookOpen },
  { mode: 'about', labelKey: 'nav.about', fallback: 'About', icon: Info },
];

export function TopNavigation({ mode, onModeChange }: TopNavigationProps) {
  const { t } = useLanguage();
  const { user, session, signOut, openAuthModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleModeChange = (nextMode: AppMode) => {
    onModeChange(nextMode);
    setMenuOpen(false);
  };

  return (
    <div className="fixed top-1 left-0 right-0 z-[110] px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <div className="flex flex-col gap-0.5 min-w-0">
                <h1 className="tracking-tight text-white font-light text-[15px] truncate">
                  {t('hero.brand')}
                </h1>
                <div className="hidden sm:block text-white/40 uppercase text-[#ffffffa8] text-[9px]">
                  EST. 2026 LA VELETA, TULUM, Q.ROO
                </div>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center bg-white/5 rounded-full p-1 shrink-0">
                {navItems.slice(0, 3).map(({ mode: itemMode, labelKey, fallback }) => (
                  <button
                    key={itemMode}
                    onClick={() => onModeChange(itemMode)}
                    className={`px-4 py-2 rounded-full transition-all text-[12px] font-thin ${
                      mode === itemMode
                        ? 'bg-green-500/20 text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    {t(labelKey) || fallback}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onModeChange('about')}
                className={`rounded-md transition-all text-[12px] font-thin ${
                  mode === 'about'
                    ? 'text-white bg-white/10'
                    : 'text-white/40 hover:text-white/70'
                } px-[18px] py-[9px]`}
              >
                {t('nav.about') || 'About'}
              </button>
            </div>

            {/* Desktop: language + user */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageToggle />
              <UserMenu />
            </div>

            {/* Mobile: menu button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          overlayClassName="z-[120]"
          className="z-[120] w-[min(85vw,320px)] border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-0 flex flex-col [&>button]:text-white/60 [&>button]:hover:text-white"
        >
          <SheetHeader className="px-5 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="text-white font-light text-left text-[15px]">
              {t('hero.brand')}
            </SheetTitle>
            <p className="text-white/40 uppercase text-[9px] text-left">
              EST. 2026 LA VELETA, TULUM, Q.ROO
            </p>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-3 py-4">
            {navItems.map(({ mode: itemMode, labelKey, fallback, icon: Icon }) => (
              <button
                key={itemMode}
                onClick={() => handleModeChange(itemMode)}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left text-[14px] font-thin transition-all ${
                  mode === itemMode
                    ? 'bg-green-500/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(labelKey) || fallback}
              </button>
            ))}
          </nav>

          <div className="mt-auto px-5 py-5 border-t border-white/10 space-y-4">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Language</p>
              <LanguageToggle />
            </div>

            {session && user ? (
              <div className="space-y-2">
                <p className="text-white/40 text-xs truncate">{user.email}</p>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); openAuthModal(); }}
                className="w-full px-4 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-full transition-all"
              >
                Sign in
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
