import { ImageWithFallback } from './figma/ImageWithFallback';
import { Droplets, TrendingUp, Leaf, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

export function HeroSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: HeroSectionProps) {
  const { t } = useLanguage();
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1774270905989-8e93f2ec3ede?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
          alt="Modern vertical farming installation"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,139,34,0.15),transparent_70%)]" />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      {/* Content Grid */}
      <div className={`relative h-full max-w-7xl mx-auto px-4 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full gap-4 md:gap-6 overflow-y-auto hiper-scroll pb-24 px-1">
          {/* Top Section */}
          

          {/* Hero Content */}
          <div className="flex-shrink-0 space-y-8 px-0 pt-[81px] pb-[24px]">
            <div className="space-y-6 max-w-4xl">


              <h2 className="tracking-tight font-thin text-white leading-[0.95] text-[32px]">
                {t('hero.title1')}
                <br />
                <span className="text-white/40">{t('hero.title2')}</span>
              </h2>

              <p className="text-white/60 max-w-2xl leading-relaxed text-[15px]">
                {t('hero.description')}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl m-[0px]">
              {[
                {
                  icon: Leaf,
                  label: t('hero.onsite'),
                  value: '24/7',
                },
                {
                  icon: Droplets,
                  label: t('hero.waterSavings'),
                  value: '95%',
                },
                {
                  icon: Zap,
                  label: t('hero.farmToTable'),
                  value: '<1hr',
                },
                {
                  icon: TrendingUp,
                  label: t('hero.spoilageReduction'),
                  value: '90%',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col gap-3">
                    <item.icon className="w-5 h-5 text-green-400/80 group-hover:text-green-400 transition-colors" />
                    <div>
                      <div className="text-2xl text-white mb-1">{item.value}</div>
                      <div className="text-xs text-white/50 uppercase tracking-wider">
                        {item.label}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-transparent transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between text-white/40 text-xs uppercase tracking-wider">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>{t('hero.activeSystems')}: 3</span>
                </div>
                <div>{t('hero.cropCycle')}: {t('hero.day')} 12/21</div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
