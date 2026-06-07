import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NextSlideButtonProps {
  onClick: () => void;
  isLastSlide?: boolean;
}

export function NextSlideButton({ onClick, isLastSlide = false }: NextSlideButtonProps) {
  const { t } = useLanguage();

  if (isLastSlide) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all duration-300 group hover:scale-105"
    >
      <span className="text-sm text-white/90 uppercase tracking-wider">
        {t('nav.nextSlide') || 'Next'}
      </span>
      <ChevronDown className="w-4 h-4 text-green-400 group-hover:translate-y-0.5 transition-transform" />
    </button>
  );
}
