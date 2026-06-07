import { AlertTriangle, TruckIcon, Flame, Package, Clock, Leaf } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProblemStatementSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

export function ProblemStatementSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: ProblemStatementSectionProps) {
  const { t } = useLanguage();

  const problems = [
    {
      icon: TruckIcon,
      title: t('problem.supplyChain.title'),
      description: t('problem.supplyChain.description'),
      impact: t('problem.supplyChain.impact'),
      color: 'red',
    },
    {
      icon: Clock,
      title: t('problem.inconsistentAvailability.title'),
      description: t('problem.inconsistentAvailability.description'),
      impact: t('problem.inconsistentAvailability.impact'),
      color: 'amber',
    },
    {
      icon: Flame,
      title: t('problem.zeroStorytelling.title'),
      description: t('problem.zeroStorytelling.description'),
      impact: t('problem.zeroStorytelling.impact'),
      color: 'orange',
    },
    {
      icon: Package,
      title: t('problem.wasteSpoilage.title'),
      description: t('problem.wasteSpoilage.description'),
      impact: t('problem.wasteSpoilage.impact'),
      color: 'red',
    },
    {
      icon: AlertTriangle,
      title: t('problem.limitedVariety.title'),
      description: t('problem.limitedVariety.description'),
      impact: t('problem.limitedVariety.impact'),
      color: 'yellow',
    },
    {
      icon: Leaf,
      title: t('problem.noGuestExperience.title'),
      description: t('problem.noGuestExperience.description'),
      impact: t('problem.noGuestExperience.impact'),
      color: 'amber',
    },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-[#0a0a0a] to-amber-950/20" />

      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-6 md:gap-8 h-full overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="space-y-3 md:space-y-4 px-[0px] pt-[48px] pb-[0px]">
              <h2 className="text-white font-light tracking-tight leading-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
                {t('problem.title')}
                <br />
                <span className="text-white/40">{t('problem.subtitle')}</span>
              </h2>
              
            </div>
          </div>

          {/* Problem Statement Card */}
          <div className="bg-gradient-to-br from-red-500/10 to-amber-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-red-500/20 rounded-xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl text-white mb-2 md:mb-3">{t('problem.currentReality')}</h3>
                <p className="text-white/70 text-sm md:text-base lg:text-lg leading-relaxed">
                  {t('problem.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              const colorClasses = {
                red: {
                  iconBg: 'bg-red-500/20',
                  iconText: 'text-red-400',
                  badgeBg: 'bg-red-500/20',
                  badgeText: 'text-red-300',
                  badgeBorder: 'border-red-500/30',
                },
                amber: {
                  iconBg: 'bg-amber-500/20',
                  iconText: 'text-amber-400',
                  badgeBg: 'bg-amber-500/20',
                  badgeText: 'text-amber-300',
                  badgeBorder: 'border-amber-500/30',
                },
                yellow: {
                  iconBg: 'bg-yellow-500/20',
                  iconText: 'text-yellow-400',
                  badgeBg: 'bg-yellow-500/20',
                  badgeText: 'text-yellow-300',
                  badgeBorder: 'border-yellow-500/30',
                },
                orange: {
                  iconBg: 'bg-orange-500/20',
                  iconText: 'text-orange-400',
                  badgeBg: 'bg-orange-500/20',
                  badgeText: 'text-orange-300',
                  badgeBorder: 'border-orange-500/30',
                },
              }[problem.color as 'red' | 'amber' | 'yellow' | 'orange'];

              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 ${colorClasses.iconBg} rounded-lg group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${colorClasses.iconText}`} />
                      </div>
                      <div className={`text-xs px-2.5 py-1 rounded-full ${colorClasses.badgeBg} ${colorClasses.badgeText} border ${colorClasses.badgeBorder}`}>
                        {problem.impact}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg text-white mb-2 font-medium">{problem.title}</h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-400/80 text-sm mb-1">{t('problem.solution')}</div>
                  <div className="text-white text-lg">
                    {t('problem.solutionText')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
