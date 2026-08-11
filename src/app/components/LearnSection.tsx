import { useMemo, useState } from 'react';
import { TrendingUp, Droplets, Zap, Beaker, BookOpen, Thermometer, Sprout } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type Tab = 'crops' | 'systems' | 'fundamentals';

interface Crop {
  id: string;
  name: string;
  cycle: number;
  yieldPerSqM: number;
  demandLevel: 'high' | 'medium' | 'low';
  difficulty: number;
  revenuePerSqM: number;
  category: 'herb' | 'green' | 'flower' | 'microgreen';
  image: string;
}

const crops: Crop[] = [
  { id: 'basil', name: 'Sweet Basil', cycle: 28, yieldPerSqM: 2.4, demandLevel: 'high', difficulty: 2, revenuePerSqM: 720, category: 'herb', image: 'https://images.unsplash.com/photo-1617618620961-502e5830b257?w=400' },
  { id: 'mint', name: 'Mint', cycle: 21, yieldPerSqM: 2.1, demandLevel: 'high', difficulty: 1, revenuePerSqM: 630, category: 'herb', image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400' },
  { id: 'cilantro', name: 'Cilantro', cycle: 25, yieldPerSqM: 2.8, demandLevel: 'high', difficulty: 2, revenuePerSqM: 840, category: 'herb', image: 'https://images.unsplash.com/photo-1592853954462-02ab362edb1d?w=400' },
  { id: 'arugula', name: 'Arugula', cycle: 21, yieldPerSqM: 3.2, demandLevel: 'medium', difficulty: 1, revenuePerSqM: 640, category: 'green', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400' },
  { id: 'lettuce', name: 'Butterhead Lettuce', cycle: 28, yieldPerSqM: 4.5, demandLevel: 'high', difficulty: 2, revenuePerSqM: 900, category: 'green', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400' },
  { id: 'edible-flowers', name: 'Edible Flowers Mix', cycle: 35, yieldPerSqM: 0.8, demandLevel: 'medium', difficulty: 4, revenuePerSqM: 1200, category: 'flower', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400' },
  { id: 'microgreens', name: 'Microgreens Blend', cycle: 10, yieldPerSqM: 1.5, demandLevel: 'high', difficulty: 3, revenuePerSqM: 1350, category: 'microgreen', image: 'https://images.unsplash.com/photo-1631544111801-5af1e77a4c87?w=400' },
  { id: 'pea-shoots', name: 'Pea Shoots', cycle: 14, yieldPerSqM: 2.2, demandLevel: 'medium', difficulty: 2, revenuePerSqM: 880, category: 'microgreen', image: 'https://images.unsplash.com/photo-1588666174463-ca3d26d5e448?w=400' },
];

const systemDefs = [
  { id: 'Nft' as const, name: 'NFT', difficulty: 2, cost: '$$', bestFor: ['Lettuce', 'Herbs', 'Arugula'], pros: ['pro1', 'pro2', 'pro3'] as const, cons: ['con1', 'con2'] as const },
  { id: 'Dwc' as const, name: 'DWC', difficulty: 1, cost: '$', bestFor: ['Lettuce', 'Basil', 'Pea Shoots'], pros: ['pro1', 'pro2', 'pro3'] as const, cons: ['con1', 'con2'] as const },
  { id: 'Ebb' as const, name: 'Ebb & Flow', difficulty: 2, cost: '$$', bestFor: ['Herbs', 'Strawberries', 'Microgreens'], pros: ['pro1', 'pro2'] as const, cons: ['con1', 'con2'] as const },
  { id: 'Drip' as const, name: 'Drip', difficulty: 3, cost: '$$$', bestFor: ['Tomatoes', 'Peppers', 'Cucumbers'], pros: ['pro1', 'pro2', 'pro3'] as const, cons: ['con1', 'con2'] as const },
  { id: 'Aero' as const, name: 'Aeroponics', difficulty: 5, cost: '$$$$', bestFor: ['Any crop', 'R&D applications'], pros: ['pro1', 'pro2', 'pro3'] as const, cons: ['con1', 'con2', 'con3'] as const },
];

const fundDefs = [
  { id: 'PhEc' as const, icon: Beaker },
  { id: 'Water' as const, icon: Droplets },
  { id: 'Light' as const, icon: Zap },
  { id: 'Nutrients' as const, icon: TrendingUp },
  { id: 'Temp' as const, icon: Thermometer },
  { id: 'GermHarvest' as const, icon: Sprout },
];

const categoryColors: Record<string, string> = {
  herb: 'bg-green-500/20 text-green-400',
  green: 'bg-blue-500/20 text-blue-400',
  flower: 'bg-purple-500/20 text-purple-400',
  microgreen: 'bg-amber-500/20 text-amber-400',
};

const categoryLabelKeys: Record<string, string> = {
  herb: 'learn.catHerb',
  green: 'learn.catGreen',
  flower: 'learn.catFlower',
  microgreen: 'learn.catMicrogreen',
};

const demandLabelKeys: Record<string, string> = {
  high: 'learn.demandHigh',
  medium: 'learn.demandMedium',
  low: 'learn.demandLow',
};

export function LearnSection() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('crops');
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'cycle' | 'difficulty'>('revenue');

  const systems = useMemo(
    () =>
      systemDefs.map(sys => ({
        ...sys,
        full: t(`learn.system${sys.id}.full`),
        desc: t(`learn.system${sys.id}.desc`),
        pros: sys.pros.map(k => t(`learn.system${sys.id}.${k}`)),
        cons: sys.cons.map(k => t(`learn.system${sys.id}.${k}`)),
      })),
    [t, language]
  );

  const fundamentals = useMemo(
    () =>
      fundDefs.map(f => ({
        ...f,
        title: t(`learn.fund${f.id}.title`),
        body: t(`learn.fund${f.id}.body`),
      })),
    [t, language]
  );

  const filteredCrops = crops
    .filter(c => filterCat === 'all' || c.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.revenuePerSqM - a.revenuePerSqM;
      if (sortBy === 'cycle') return a.cycle - b.cycle;
      return a.difficulty - b.difficulty;
    });

  return (
    <div className="bg-[#0a0a0a] min-h-full">
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-[24px] pt-[30px] pb-[0px]">
        <div className="flex gap-1 max-w-4xl mx-auto">
          {([['crops', t('learn.tabCrops')], ['systems', t('learn.tabSystems')], ['fundamentals', t('learn.tabFundamentals')]] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 text-sm transition-all border-b-2 ${activeTab === id ? 'text-white border-green-500' : 'text-white/50 border-transparent hover:text-white/80'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-[40px]">

        {/* ── Crops ─────────────────────────────────────────────────────────── */}
        {activeTab === 'crops' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl text-white mb-1">{t('learn.cropsTitle')}</h2>
              <p className="text-white/50 text-sm">{t('learn.cropsSubtitle')}</p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {['all', 'herb', 'green', 'microgreen', 'flower'].map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${filterCat === cat ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}>
                    {cat === 'all' ? t('learn.filterAll') : t(categoryLabelKeys[cat])}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 ml-auto">
                {([['revenue', '$'], ['cycle', '⏱'], ['difficulty', '★']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setSortBy(key)} className={`px-3 py-1.5 rounded-lg text-xs transition-all ${sortBy === key ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCrops.map(crop => (
                <div key={crop.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                  <div className="h-36 relative overflow-hidden">
                    <img src={crop.image} alt={crop.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${categoryColors[crop.category]}`}>{t(categoryLabelKeys[crop.category])}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${crop.demandLevel === 'high' ? 'bg-green-500/20 text-green-400' : crop.demandLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>
                        {t(demandLabelKeys[crop.demandLevel])}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white">{crop.name}</h3>
                      <div className="text-green-400 text-sm">${crop.revenuePerSqM}/m²</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-white/40 mb-0.5">{t('learn.cycle')}</div><div className="text-white">{crop.cycle}d</div></div>
                      <div><div className="text-white/40 mb-0.5">{t('learn.yield')}</div><div className="text-white">{crop.yieldPerSqM} kg/m²</div></div>
                      <div><div className="text-white/40 mb-0.5">{t('learn.difficulty')}</div><div className="text-white">{'★'.repeat(crop.difficulty)}{'☆'.repeat(5 - crop.difficulty)}</div></div>
                    </div>
                    <p className="text-xs text-white/50">{t(`learn.cropNotes.${crop.id}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Systems ───────────────────────────────────────────────────────── */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl text-white mb-1">{t('learn.systemsTitle')}</h2>
              <p className="text-white/50 text-sm">{t('learn.systemsSubtitle')}</p>
            </div>
            <div className="space-y-4">
              {systems.map(sys => (
                <div key={sys.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white text-lg">{sys.name}</span>
                        <span className="text-white/40 text-sm">— {sys.full}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-amber-400">{sys.cost} {t('learn.cost')}</span>
                        <span className="text-white/40">{t('learn.difficulty')}: {'●'.repeat(sys.difficulty)}{'○'.repeat(5 - sys.difficulty)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{sys.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <div className="text-xs text-white/40 mb-2">{t('learn.bestFor')}</div>
                      <div className="flex flex-wrap gap-1">
                        {sys.bestFor.map(c => <span key={c} className="bg-green-500/10 text-green-400 rounded-md text-[11px] font-thin px-[12px] py-[6px]">{c}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-2">{t('learn.pros')}</div>
                      <ul className="space-y-1">{sys.pros.map(p => <li key={p} className="text-xs text-white/60">+ {p}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-2">{t('learn.cons')}</div>
                      <ul className="space-y-1">{sys.cons.map(c => <li key={c} className="text-xs text-white/60">− {c}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fundamentals ──────────────────────────────────────────────────── */}
        {activeTab === 'fundamentals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl text-white mb-1">{t('learn.fundamentalsTitle')}</h2>
              <p className="text-white/50 text-sm">{t('learn.fundamentalsSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fundamentals.map(f => (
                <div key={f.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white">{f.title}</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-white/30 mx-auto" />
              <div className="text-white/60 text-sm">{t('learn.comingSoon')}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
