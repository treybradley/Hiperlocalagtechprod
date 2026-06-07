import { useState } from 'react';
import { Badge } from './ui/badge';
import { DollarSign, TrendingUp, AlertCircle, Users, Eye, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useLanguage } from '../contexts/LanguageContext';

interface PartnershipSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

interface PartnershipModel {
  id: string;
  name: string;
  description: string;
  startupCost: { min: number; max: number };
  monthlyMaintenance: { min: number; max: number };
  expectedRevenue: { min: number; max: number };
  complexity: 'low' | 'medium' | 'high';
  scalability: number; // 1-5
  riskLevel: 'low' | 'medium' | 'high';
  aestheticValue: number; // 1-5
  guestExperience: number; // 1-5
  setupTime: string;
  advantages: string[];
  considerations: string[];
  idealFor: string;
  image: string;
}

const partnerships: PartnershipModel[] = [
  {
    id: 'free-space',
    name: 'Free-Space Partnership',
    description: 'Utilize unused kitchen or storage space with minimal infrastructure',
    startupCost: { min: 12000, max: 25000 },
    monthlyMaintenance: { min: 1200, max: 2500 },
    expectedRevenue: { min: 3500, max: 8000 },
    complexity: 'low',
    scalability: 3,
    riskLevel: 'low',
    aestheticValue: 2,
    guestExperience: 1,
    setupTime: '2-3 weeks',
    advantages: [
      'Minimal upfront investment',
      'Low commitment from venue',
      'Quick implementation',
      'Easy to test partnership',
    ],
    considerations: [
      'Limited visibility to guests',
      'Dependent on space availability',
      'May compete for space during growth',
    ],
    idealFor: 'Initial partnerships, kitchen-focused venues',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600',
  },
  {
    id: 'rented-room',
    name: 'Rented Microfarm Room',
    description: 'Dedicated climate-controlled room with full automation',
    startupCost: { min: 35000, max: 75000 },
    monthlyMaintenance: { min: 3500, max: 6500 },
    expectedRevenue: { min: 12000, max: 25000 },
    complexity: 'medium',
    scalability: 4,
    riskLevel: 'medium',
    aestheticValue: 3,
    guestExperience: 2,
    setupTime: '6-8 weeks',
    advantages: [
      'Controlled environment',
      'Higher yields and consistency',
      'Professional operation',
      'Room for expansion',
    ],
    considerations: [
      'Higher initial investment',
      'Rent commitment required',
      'Climate control costs',
      'More complex setup',
    ],
    idealFor: 'Established venues, multiple restaurants',
    image: 'https://images.unsplash.com/photo-1774291981971-ec2ec7a8cd0e?w=600',
  },
  {
    id: 'hotel-installation',
    name: 'Boutique Hotel Installation',
    description: 'Custom integrated farm serving hotel restaurant and amenities',
    startupCost: { min: 50000, max: 120000 },
    monthlyMaintenance: { min: 4500, max: 8500 },
    expectedRevenue: { min: 15000, max: 35000 },
    complexity: 'high',
    scalability: 5,
    riskLevel: 'medium',
    aestheticValue: 4,
    guestExperience: 4,
    setupTime: '10-12 weeks',
    advantages: [
      'Premium brand alignment',
      'Multiple revenue streams',
      'High guest visibility',
      'Sustainability marketing value',
    ],
    considerations: [
      'Significant investment',
      'Longer setup time',
      'Requires strong partnership',
      'Higher operational complexity',
    ],
    idealFor: 'Eco-luxury hotels, wellness resorts',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
  },
  {
    id: 'bar-herb-wall',
    name: 'Visible Bar Herb Wall',
    description: 'Architectural living wall installation behind bar area',
    startupCost: { min: 28000, max: 65000 },
    monthlyMaintenance: { min: 2800, max: 5000 },
    expectedRevenue: { min: 8000, max: 18000 },
    complexity: 'high',
    scalability: 2,
    riskLevel: 'medium',
    aestheticValue: 5,
    guestExperience: 5,
    setupTime: '4-6 weeks',
    advantages: [
      'Stunning visual impact',
      'Live cocktail garnish',
      'Social media appeal',
      'Premium brand positioning',
    ],
    considerations: [
      'High visibility = high standards',
      'Limited to herbs and garnishes',
      'Aesthetic maintenance critical',
      'Less scalable',
    ],
    idealFor: 'Cocktail bars, high-end restaurants',
    image: 'https://images.unsplash.com/photo-1743148509752-9ea6072ea35f?w=600',
  },
  {
    id: 'container-farm',
    name: 'Shipping Container Farm',
    description: 'Fully self-contained modular farm unit',
    startupCost: { min: 85000, max: 150000 },
    monthlyMaintenance: { min: 5500, max: 9500 },
    expectedRevenue: { min: 20000, max: 45000 },
    complexity: 'high',
    scalability: 5,
    riskLevel: 'high',
    aestheticValue: 4,
    guestExperience: 3,
    setupTime: '12-16 weeks',
    advantages: [
      'Maximum production capacity',
      'Fully independent operation',
      'Relocatable asset',
      'Climate-independent',
    ],
    considerations: [
      'Highest upfront cost',
      'Requires outdoor space',
      'Complex permitting',
      'Significant operating costs',
    ],
    idealFor: 'Large resorts, multi-venue operations',
    image: 'https://images.unsplash.com/photo-1508855898412-54387cfbb044?w=600',
  },
];

export function PartnershipSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: PartnershipSectionProps) {
  const { t } = useLanguage();
  const [selectedPartnership, setSelectedPartnership] = useState<string | null>(null);

  // Get translated partnership data
  const getTranslatedPartnerships = (): PartnershipModel[] => {
    return partnerships.map(p => {
      const prefix = p.id === 'free-space' ? 'freeSpace' :
                     p.id === 'rented-room' ? 'rentedRoom' :
                     p.id === 'hotel-installation' ? 'hotel' :
                     p.id === 'bar-herb-wall' ? 'barWall' :
                     'container';

      return {
        ...p,
        advantages: t(`partnerships.${prefix}Advantages`) as any as string[],
        considerations: t(`partnerships.${prefix}Considerations`) as any as string[],
        idealFor: t(`partnerships.${prefix}IdealFor`),
      };
    });
  };

  const translatedPartnerships = getTranslatedPartnerships();
  const selected = translatedPartnerships.find(p => p.id === selectedPartnership);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full gap-4 md:gap-6 overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="space-y-2 flex-shrink-0 px-[0px] pt-[48px] pb-[0px]">
            <h2 className="font-thin text-white tracking-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
              {t('partnerships.title')}
              <br />
              <span className="text-white/40">{t('partnerships.subtitle')}</span>
            </h2>
            <p className="text-white/50 text-xs md:text-sm max-w-2xl">
              {t('partnerships.description')}
            </p>
          </div>

          {/* Partnership Grid */}
          <div className="flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {translatedPartnerships.map((partnership) => {
                return (
                  <button
                    key={partnership.id}
                    onClick={() => setSelectedPartnership(partnership.id)}
                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-left h-full"
                  >
                    {/* Image */}
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={partnership.image}
                        alt={partnership.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                      {/* Complexity Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] border-white/30 ${
                            partnership.complexity === 'low'
                              ? 'bg-green-500/20 text-green-300'
                              : partnership.complexity === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {t(`partnerships.${partnership.complexity}`)}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-sm text-white mb-1">{partnership.name}</h3>
                        <p className="text-xs text-white/50 line-clamp-2">{partnership.description}</p>
                      </div>

                      {/* Key Metrics */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">{t('partnerships.startup')}</span>
                          <span className="text-white">
                            ${partnership.startupCost.min / 1000}-{partnership.startupCost.max / 1000}k
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">{t('partnerships.revenue')}</span>
                          <span className="text-green-400">
                            ${partnership.expectedRevenue.min / 1000}-{partnership.expectedRevenue.max / 1000}k
                          </span>
                        </div>
                      </div>

                      {/* Experience Icons */}
                      <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-white/40" />
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  i < partnership.aestheticValue ? 'bg-green-400' : 'bg-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-white/40" />
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  i < partnership.guestExperience ? 'bg-blue-400' : 'bg-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Partnership Detail Dialog */}
      <Dialog open={!!selectedPartnership} onOpenChange={(open) => !open && setSelectedPartnership(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] max-h-[80vh] overflow-y-auto bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10">
          {selected && (
            <>
              <DialogTitle className="text-xl md:text-2xl text-white pr-8">{selected.name}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-white/60">{selected.description}</DialogDescription>
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Left: Overview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-white/40" />
                      <span className="text-xs text-white/60">{t('partnerships.setup')}: {selected.setupTime}</span>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <div className="text-xs text-green-400/60 uppercase tracking-wider mb-1">{t('partnerships.idealFor')}</div>
                      <div className="text-sm text-white">{selected.idealFor}</div>
                    </div>
                  </div>

                {/* Middle: Advantages & Considerations */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-2">{t('partnerships.advantages')}</div>
                    <ul className="space-y-1.5">
                      {selected.advantages.map((adv, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                          <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5" />
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-2">{t('partnerships.considerations')}</div>
                    <ul className="space-y-1.5">
                      {selected.considerations.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                          <AlertCircle className="w-3 h-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="grid grid-cols-2 gap-3 m-[0px]">
                  <div className="bg-white/5 rounded-xl px-[25px] py-[12px]">
                    <DollarSign className="w-4 h-4 text-amber-400/60 mb-2" />
                    <div className="text-lg text-white mb-1">
                      ${selected.startupCost.min / 1000}-{selected.startupCost.max / 1000}k
                    </div>
                    <div className="text-xs text-white/40 uppercase">Startup</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <Wrench className="w-4 h-4 text-blue-400/60 mb-2" />
                    <div className="text-lg text-white mb-1">
                      ${selected.monthlyMaintenance.min / 1000}-{selected.monthlyMaintenance.max / 1000}k
                    </div>
                    <div className="text-xs text-white/40 uppercase">{t('financial.mensual')}</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <TrendingUp className="w-4 h-4 text-green-400/60 mb-2" />
                    <div className="text-lg text-white mb-1">
                      ${selected.expectedRevenue.min / 1000}-{selected.expectedRevenue.max / 1000}k
                    </div>
                    <div className="text-xs text-white/40 uppercase">{t('partnerships.revenue')}</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <AlertCircle
                      className={`w-4 h-4 mb-2 ${
                        selected.riskLevel === 'low'
                          ? 'text-green-400/60'
                          : selected.riskLevel === 'medium'
                          ? 'text-yellow-400/60'
                          : 'text-red-400/60'
                      }`}
                    />
                    <div className="text-lg text-white mb-1 capitalize">{t(`partnerships.${selected.riskLevel}`)}</div>
                    <div className="text-xs text-white/40 uppercase">{t('partnerships.risk')}</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <Eye className="w-4 h-4 text-purple-400/60 mb-2" />
                    <div className="text-lg text-white mb-1">{selected.aestheticValue}/5</div>
                    <div className="text-xs text-white/40 uppercase">{t('partnerships.aesthetic')}</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <Users className="w-4 h-4 text-blue-400/60 mb-2" />
                    <div className="text-lg text-white mb-1">{selected.guestExperience}/5</div>
                    <div className="text-xs text-white/40 uppercase">{t('partnerships.experience')}</div>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
