import { Leaf, Settings, LayoutGrid, BookOpen, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface TopNavigationProps {
  mode: 'planning' | 'operations' | 'about' | 'learn';
  onModeChange: (mode: 'planning' | 'operations' | 'about' | 'learn') => void;
}

export function TopNavigation({ mode, onModeChange }: TopNavigationProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed top-1 left-0 right-0 z-[110] px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
<div className="flex-shrink-0 flex items-center justify-between m-[0px] p-[0px]">
            {/* Logo/Brand */}
            <div className="flex flex-col gap-1">

              <h1 className="tracking-tight text-white font-light p-[0px] text-[15px]">
                {t('hero.brand')}
              </h1>
              <div className="text-white/40 uppercase text-[#ffffffa8] text-[9px]">EST. 2026 LA VELETA, TULUM, Q.ROO</div>
            </div>

            {/* Status Indicators */}

          </div>
            </div>

            {/* Center nav: mode toggle pill (Ideation · Operations · Learn) + About link */}
            <div className="flex items-center gap-2">
              {/* Pill — mobile: icons only, desktop: text */}
              <div className="flex items-center bg-white/5 rounded-full p-1 shrink-0">
                {/* Mobile */}
                <button onClick={() => onModeChange('planning')} className={`sm:hidden p-2 rounded-full transition-all ${mode === 'planning' ? 'bg-green-500/20 text-white' : 'text-white/60 hover:text-white/80'}`} aria-label="Ideation"><Leaf className="w-4 h-4" /></button>
                <button onClick={() => onModeChange('operations')} className={`sm:hidden p-2 rounded-full transition-all ${mode === 'operations' ? 'bg-green-500/20 text-white' : 'text-white/60 hover:text-white/80'}`} aria-label="Operations"><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => onModeChange('learn')} className={`sm:hidden p-2 rounded-full transition-all ${mode === 'learn' ? 'bg-green-500/20 text-white' : 'text-white/60 hover:text-white/80'}`} aria-label="Learn"><BookOpen className="w-4 h-4" /></button>
                {/* Desktop */}
                <button onClick={() => onModeChange('planning')} className={`hidden sm:block px-4 py-2 rounded-full transition-all text-[12px] font-thin ${mode === 'planning' ? 'bg-green-500/20 text-white' : 'text-white/60 hover:text-white/80'}`}>{t('nav.planning') || 'Ideation'}</button>
                <button onClick={() => onModeChange('operations')} className={`hidden sm:block px-4 py-2 rounded-full transition-all text-[12px] font-thin ${mode === 'operations' ? 'bg-green-500/20 text-white' : 'text-white/60 hover:text-white/80'}`}>{t('nav.operations') || 'Operations'}</button>
                <button onClick={() => onModeChange('learn')} className={`hidden sm:block px-4 py-2 rounded-full transition-all text-[12px] font-thin ${mode === 'learn' ? 'bg-green-500/20 text-white' : 'text-white/60 hover:text-white/80'}`}>Learn</button>
              </div>

              {/* About — separate button, desktop text + mobile icon */}
              <button onClick={() => onModeChange('about')} className={`hidden sm:block rounded-md transition-all text-[12px] font-thin ${mode === 'about' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/70'} px-[18px] py-[9px]`}>About</button>
              <button onClick={() => onModeChange('about')} className={`sm:hidden p-2 rounded-md transition-all ${mode === 'about' ? 'text-white' : 'text-white/40 hover:text-white/60'}`} aria-label="About"><Info className="w-3.5 h-3.5" /></button>
            </div>

            {/* Language + Settings */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <LanguageToggle />
              <button className="text-white/60 hover:text-white transition-colors p-1">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
