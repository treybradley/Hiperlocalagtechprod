import { ImageWithFallback } from './figma/ImageWithFallback';
import { Leaf, Zap, Droplets, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SolutionSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

export function SolutionSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: SolutionSectionProps) {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Leaf,
      title: t('solution.benefit1Title'),
      description: t('solution.benefit1Desc'),
    },
    {
      icon: Zap,
      title: t('solution.benefit2Title'),
      description: t('solution.benefit2Desc'),
    },
    {
      icon: Droplets,
      title: t('solution.benefit3Title'),
      description: t('solution.benefit3Desc'),
    },
    {
      icon: TrendingUp,
      title: t('solution.benefit4Title'),
      description: t('solution.benefit4Desc'),
    },
  ];

  const features = [
    t('solution.feature1'),
    t('solution.feature2'),
    t('solution.feature3'),
    t('solution.feature4'),
    t('solution.feature5'),
    t('solution.feature6'),
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
          alt="Hydroponic farming system"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]" />
      </div>

      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full gap-4 md:gap-6 overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="flex-shrink-0 space-y-4 px-[0px] pt-[48px] pb-[0px]">
            <h2 className="text-white font-thin tracking-tight leading-tight px-[0px] pt-[12px] pb-[0px] text-[36px]">
              {t('solution.title')}
              <br />
              <span className="text-white/40">{t('solution.subtitle')}</span>
            </h2>
            <p className="text-xl text-white/60 max-w-3xl leading-relaxed">
              {t('solution.description')}
            </p>
          </div>

          {/* Main Value Proposition */}
          <div className="flex-shrink-0 bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-2xl flex-shrink-0">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl text-white">{t('solution.valueTitle')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('solution.valueDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex flex-col gap-4">
                    <benefit.icon className="w-8 h-8 text-green-400/80 group-hover:text-green-400 transition-colors" />
                    <div>
                      <h4 className="text-lg text-white mb-2">{benefit.title}</h4>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
            <h3 className="text-xl text-white mb-6">{t('solution.keyFeatures')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/70">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-4">
            <p className="text-lg text-white/80">
              {t('solution.cta')}
            </p>
          </div>


        </div>
      </div>
    </div>
  );
}
