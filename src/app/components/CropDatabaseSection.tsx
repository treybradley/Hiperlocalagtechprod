import { useState } from 'react';
import { Badge } from './ui/badge';
import { Leaf, TrendingUp, Clock, Droplets, AlertTriangle, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CropDatabaseSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

type SortKey = 'name' | 'cycle' | 'yield' | 'revenue' | 'difficulty';

interface Crop {
  id: string;
  name: string;
  cycle: number; // days
  yieldPerSqM: number; // kg/month
  demandLevel: 'high' | 'medium' | 'low';
  spoilageReduction: number; // percentage
  difficulty: number; // 1-5
  humiditySensitive: boolean;
  revenuePerSqM: number; // MXN/month
  category: 'herb' | 'green' | 'flower' | 'microgreen';
  image: string;
  notes: string;
}

const crops: Crop[] = [
  {
    id: 'basil',
    name: 'Sweet Basil',
    cycle: 28,
    yieldPerSqM: 2.4,
    demandLevel: 'high',
    spoilageReduction: 92,
    difficulty: 2,
    humiditySensitive: true,
    revenuePerSqM: 720,
    category: 'herb',
    image: 'https://images.unsplash.com/photo-1617618620961-502e5830b257?w=400',
    notes: 'Premium hospitality demand, fast turnover',
  },
  {
    id: 'mint',
    name: 'Mint',
    cycle: 21,
    yieldPerSqM: 2.1,
    demandLevel: 'high',
    spoilageReduction: 88,
    difficulty: 1,
    humiditySensitive: false,
    revenuePerSqM: 630,
    category: 'herb',
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400',
    notes: 'Bar & cocktail favorite, very hardy',
  },
  {
    id: 'cilantro',
    name: 'Cilantro',
    cycle: 25,
    yieldPerSqM: 2.8,
    demandLevel: 'high',
    spoilageReduction: 85,
    difficulty: 2,
    humiditySensitive: true,
    revenuePerSqM: 840,
    category: 'herb',
    image: 'https://images.unsplash.com/photo-1592853954462-02ab362edb1d?w=400',
    notes: 'Mexican cuisine essential, high volume',
  },
  {
    id: 'arugula',
    name: 'Arugula',
    cycle: 21,
    yieldPerSqM: 3.2,
    demandLevel: 'medium',
    spoilageReduction: 90,
    difficulty: 1,
    humiditySensitive: false,
    revenuePerSqM: 640,
    category: 'green',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
    notes: 'Fast-growing, excellent margins',
  },
  {
    id: 'lettuce',
    name: 'Butterhead Lettuce',
    cycle: 28,
    yieldPerSqM: 4.5,
    demandLevel: 'high',
    spoilageReduction: 87,
    difficulty: 2,
    humiditySensitive: true,
    revenuePerSqM: 900,
    category: 'green',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
    notes: 'Reliable staple, consistent demand',
  },
  {
    id: 'edible-flowers',
    name: 'Edible Flowers Mix',
    cycle: 35,
    yieldPerSqM: 0.8,
    demandLevel: 'medium',
    spoilageReduction: 95,
    difficulty: 4,
    humiditySensitive: true,
    revenuePerSqM: 1200,
    category: 'flower',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400',
    notes: 'Ultra-premium, high-end restaurants only',
  },
  {
    id: 'microgreens',
    name: 'Microgreens Blend',
    cycle: 10,
    yieldPerSqM: 1.5,
    demandLevel: 'high',
    spoilageReduction: 93,
    difficulty: 3,
    humiditySensitive: true,
    revenuePerSqM: 1350,
    category: 'microgreen',
    image: 'https://images.unsplash.com/photo-1631544111801-5af1e77a4c87?w=400',
    notes: 'Fastest cycle, highest revenue density',
  },
  {
    id: 'shiso',
    name: 'Shiso (Perilla)',
    cycle: 30,
    yieldPerSqM: 1.8,
    demandLevel: 'low',
    spoilageReduction: 91,
    difficulty: 3,
    humiditySensitive: true,
    revenuePerSqM: 810,
    category: 'herb',
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400',
    notes: 'Niche Japanese/fusion restaurants',
  },
  {
    id: 'pea-shoots',
    name: 'Pea Shoots',
    cycle: 14,
    yieldPerSqM: 2.2,
    demandLevel: 'medium',
    spoilageReduction: 89,
    difficulty: 2,
    humiditySensitive: false,
    revenuePerSqM: 880,
    category: 'microgreen',
    image: 'https://images.unsplash.com/photo-1588666174463-ca3d26d5e448?w=400',
    notes: 'Great for salads, garnish appeal',
  },
];

export function CropDatabaseSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: CropDatabaseSectionProps) {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredAndSorted = crops
    .filter(crop => filterCategory === 'all' || crop.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cycle':
          return a.cycle - b.cycle;
        case 'yield':
          return b.yieldPerSqM - a.yieldPerSqM;
        case 'revenue':
          return b.revenuePerSqM - a.revenuePerSqM;
        case 'difficulty':
          return a.difficulty - b.difficulty;
        default:
          return 0;
      }
    });

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full gap-4 md:gap-6 overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="flex-shrink-0 space-y-4 px-[0px] pt-[48px] pb-[0px]">
            <h2 className="text-white font-thin tracking-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
              {t('crops.title')}
              <br />
              <span className="text-white/40">{t('crops.subtitle')}</span>
            </h2>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5 md:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1.5">
                {['all', 'herb', 'green', 'microgreen', 'flower'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs uppercase tracking-wider transition-all ${
                      filterCategory === cat
                        ? 'bg-white/20 text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {t(`crops.${cat}`)}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex flex-wrap gap-1.5 md:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1.5">
                {[
                  { key: 'revenue', label: t('crops.revenue') },
                  { key: 'cycle', label: t('crops.cycle') },
                  { key: 'difficulty', label: t('crops.ease') },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key as SortKey)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs uppercase tracking-wider transition-all ${
                      sortBy === option.key
                        ? 'bg-white/20 text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Crop Grid */}
          <div className="flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredAndSorted.map((crop) => (
                <div
                  key={crop.id}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {/* Crop Image */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={crop.image}
                      alt={crop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Difficulty Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="outline"
                        className={`text-xs border-white/30 ${
                          crop.difficulty <= 2
                            ? 'bg-green-500/20 text-green-300'
                            : crop.difficulty === 3
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {crop.difficulty <= 2 ? t('crops.easy') : crop.difficulty === 3 ? t('crops.medium') : t('crops.advanced')}
                      </Badge>
                    </div>

                    {/* Demand Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge
                        variant="outline"
                        className={`text-xs border-white/30 ${
                          crop.demandLevel === 'high'
                            ? 'bg-green-500/20 text-green-300'
                            : crop.demandLevel === 'medium'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {t(`crops.${crop.demandLevel}Demand`)}
                      </Badge>
                    </div>
                  </div>

                  {/* Crop Info */}
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="text-xl text-white mb-1">{crop.name}</h3>
                      <p className="text-xs text-white/50">{crop.notes}</p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Growth Cycle */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-400/60" />
                        <div>
                          <div className="text-sm text-white">{crop.cycle}d</div>
                          <div className="text-[10px] text-white/40 uppercase">Cycle</div>
                        </div>
                      </div>

                      {/* Revenue */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-green-400/60" />
                        <div>
                          <div className="text-sm text-white">${crop.revenuePerSqM}</div>
                          <div className="text-[10px] text-white/40 uppercase">$/m²/mo</div>
                        </div>
                      </div>

                      {/* Yield */}
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-green-400/60" />
                        <div>
                          <div className="text-sm text-white">{crop.yieldPerSqM}kg</div>
                          <div className="text-[10px] text-white/40 uppercase">Yield/m²</div>
                        </div>
                      </div>

                      {/* Spoilage */}
                      <div className="flex items-center gap-2">
                        {crop.humiditySensitive ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
                        ) : (
                          <Droplets className="w-3.5 h-3.5 text-blue-400/60" />
                        )}
                        <div>
                          <div className="text-sm text-white">{crop.spoilageReduction}%</div>
                          <div className="text-[10px] text-white/40 uppercase">Fresh+</div>
                        </div>
                      </div>
                    </div>

                    {/* Humidity Warning */}
                    {crop.humiditySensitive && (
                      <div className="flex items-center gap-2 text-amber-400/60 text-xs">
                        <Droplets className="w-3 h-3" />
                        <span>{t('crops.humiditySensitive')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
