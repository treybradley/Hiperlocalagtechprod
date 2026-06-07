import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SlideNavigationProps {
  onNext?: () => void;
  onPrev?: () => void;
  isFirstSlide?: boolean;
  isLastSlide?: boolean;
}

export function SlideNavigation({ onNext, onPrev, isFirstSlide = false, isLastSlide = false }: SlideNavigationProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Back Button */}
      {!isFirstSlide && onPrev && (
        <button
          onClick={onPrev}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 rounded-full px-6 py-3 transition-all duration-300 group hover:scale-105 max-w-[200px]"
        >
          <ChevronUp className="w-4 h-4 text-white/60 group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-sm text-white/70 uppercase tracking-wider">
            {t('nav.prevSlide') || 'Back'}
          </span>
        </button>
      )}

      {/* Next Button */}
      {!isLastSlide && onNext && (
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all duration-300 group hover:scale-105 max-w-[200px]"
        >
          <span className="text-sm text-white/90 uppercase tracking-wider">
            {t('nav.nextSlide') || 'Next'}
          </span>
          <ChevronDown className="w-4 h-4 text-green-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
