import { useState } from 'react';
import { Leaf, TrendingUp, Clock, Droplets, Zap, Beaker, BookOpen } from 'lucide-react';

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
  notes: string;
}

const crops: Crop[] = [
  { id: 'basil', name: 'Sweet Basil', cycle: 28, yieldPerSqM: 2.4, demandLevel: 'high', difficulty: 2, revenuePerSqM: 720, category: 'herb', image: 'https://images.unsplash.com/photo-1617618620961-502e5830b257?w=400', notes: 'Premium hospitality demand, fast turnover' },
  { id: 'mint', name: 'Mint', cycle: 21, yieldPerSqM: 2.1, demandLevel: 'high', difficulty: 1, revenuePerSqM: 630, category: 'herb', image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400', notes: 'Bar & cocktail favorite, very hardy' },
  { id: 'cilantro', name: 'Cilantro', cycle: 25, yieldPerSqM: 2.8, demandLevel: 'high', difficulty: 2, revenuePerSqM: 840, category: 'herb', image: 'https://images.unsplash.com/photo-1592853954462-02ab362edb1d?w=400', notes: 'Mexican cuisine essential, high volume' },
  { id: 'arugula', name: 'Arugula', cycle: 21, yieldPerSqM: 3.2, demandLevel: 'medium', difficulty: 1, revenuePerSqM: 640, category: 'green', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400', notes: 'Fast-growing, excellent margins' },
  { id: 'lettuce', name: 'Butterhead Lettuce', cycle: 28, yieldPerSqM: 4.5, demandLevel: 'high', difficulty: 2, revenuePerSqM: 900, category: 'green', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400', notes: 'Reliable staple, consistent demand' },
  { id: 'edible-flowers', name: 'Edible Flowers Mix', cycle: 35, yieldPerSqM: 0.8, demandLevel: 'medium', difficulty: 4, revenuePerSqM: 1200, category: 'flower', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400', notes: 'Ultra-premium, high-end restaurants only' },
  { id: 'microgreens', name: 'Microgreens Blend', cycle: 10, yieldPerSqM: 1.5, demandLevel: 'high', difficulty: 3, revenuePerSqM: 1350, category: 'microgreen', image: 'https://images.unsplash.com/photo-1631544111801-5af1e77a4c87?w=400', notes: 'Fastest cycle, highest revenue density' },
  { id: 'pea-shoots', name: 'Pea Shoots', cycle: 14, yieldPerSqM: 2.2, demandLevel: 'medium', difficulty: 2, revenuePerSqM: 880, category: 'microgreen', image: 'https://images.unsplash.com/photo-1588666174463-ca3d26d5e448?w=400', notes: 'Great for salads, garnish appeal' },
];

const systems = [
  { name: 'NFT', full: 'Nutrient Film Technique', desc: 'A thin film of nutrient solution flows continuously over roots in shallow channels. Excellent oxygen exposure. Best for leafy greens and herbs.', difficulty: 2, cost: '$$', bestFor: ['Lettuce', 'Herbs', 'Arugula'], pros: ['Low water use', 'Good yields', 'Easy monitoring'], cons: ['Pump failure = rapid die-off', 'Not for heavy fruiting crops'] },
  { name: 'DWC', full: 'Deep Water Culture', desc: 'Plants suspended in net pots with roots submerged in oxygenated nutrient solution. Simple and high-yielding for beginners.', difficulty: 1, cost: '$', bestFor: ['Lettuce', 'Basil', 'Pea Shoots'], pros: ['Very cheap to set up', 'High yields', 'Beginner friendly'], cons: ['Needs constant aeration', 'Root rot risk in warm climates'] },
  { name: 'Ebb & Flow', full: 'Ebb & Flow (Flood & Drain)', desc: 'Grow medium floods on a timer, then drains. Versatile — works with many substrates. Good for small-to-medium setups.', difficulty: 2, cost: '$$', bestFor: ['Herbs', 'Strawberries', 'Microgreens'], pros: ['Flexible crop choice', 'Easy to automate'], cons: ['Requires reliable timer', 'More components = more failure points'] },
  { name: 'Drip', full: 'Drip System', desc: 'Nutrient solution drips directly to the base of each plant via emitters. Scalable and widely used commercially.', difficulty: 3, cost: '$$$', bestFor: ['Tomatoes', 'Peppers', 'Cucumbers'], pros: ['Very scalable', 'Works for fruiting crops', 'Precise control'], cons: ['Emitters can clog', 'More complex plumbing'] },
  { name: 'Aeroponics', full: 'Aeroponics', desc: 'Roots hang in air and are misted with nutrient solution at intervals. Highest oxygen, fastest growth — but technically demanding.', difficulty: 5, cost: '$$$$', bestFor: ['Any crop', 'R&D applications'], pros: ['Fastest growth rates', 'Maximum oxygenation', 'Low water use'], cons: ['Expensive', 'Misting nozzles clog', 'Zero fault tolerance'] },
];

const fundamentals = [
  { icon: Beaker, title: 'pH & EC', body: 'pH (5.5–6.5 for most crops) controls nutrient availability. EC (electrical conductivity) measures nutrient concentration. Monitor both daily. Drift outside range causes deficiencies even with perfect nutrients.' },
  { icon: Droplets, title: 'Water & Oxygen', body: 'Roots need both water AND air. Overwatering kills by starving roots of oxygen. Most hydro systems solve this by design — but in DWC, your air pump is life support. Never skip it.' },
  { icon: Zap, title: 'Light Spectrum & Duration', body: 'Leafy greens thrive under blue-dominant light (400–500nm). Fruiting crops need red (600–700nm). Most crops want 14–18hrs of light per day with a true dark period for rest.' },
  { icon: TrendingUp, title: 'Nutrient Management', body: 'Mix A and B separately before combining (calcium reacts with sulfates). Start at half strength for seedlings. Top up with fresh water between full reservoir changes (every 7–14 days).' },
  { icon: Leaf, title: 'Temperature & Humidity', body: 'Air 18–24°C, water 18–22°C for most crops. High humidity (>80%) invites fungal disease. Good airflow is as important as temperature — still air is the enemy.' },
  { icon: Clock, title: 'Germination to Harvest', body: 'Germinate in rockwool or rapid rooters at 22–26°C with high humidity. Transfer to system when roots reach 2–3cm. First harvest timing varies: microgreens (7–14 days), herbs (3–5 weeks), lettuce (4–6 weeks).' },
];

const categoryColors: Record<string, string> = {
  herb: 'bg-green-500/20 text-green-400',
  green: 'bg-blue-500/20 text-blue-400',
  flower: 'bg-purple-500/20 text-purple-400',
  microgreen: 'bg-amber-500/20 text-amber-400',
};

export function LearnSection() {
  const [activeTab, setActiveTab] = useState<Tab>('crops');
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'cycle' | 'difficulty'>('revenue');

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
          {([['crops', 'Crop Database'], ['systems', 'System Types'], ['fundamentals', 'Fundamentals']] as [Tab, string][]).map(([id, label]) => (
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

      <div className="max-w-4xl mx-auto px-[0px] py-[40px]">

        {/* ── Crops ─────────────────────────────────────────────────────────── */}
        {activeTab === 'crops' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl text-white mb-1">Crop Database</h2>
              <p className="text-white/50 text-sm">Performance data for common hydroponic crops. Revenue figures in MXN/m²/month.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {['all', 'herb', 'green', 'microgreen', 'flower'].map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${filterCat === cat ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}>
                    {cat}
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
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${categoryColors[crop.category]}`}>{crop.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${crop.demandLevel === 'high' ? 'bg-green-500/20 text-green-400' : crop.demandLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>
                        {crop.demandLevel} demand
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white">{crop.name}</h3>
                      <div className="text-green-400 text-sm">${crop.revenuePerSqM}/m²</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-white/40 mb-0.5">Cycle</div><div className="text-white">{crop.cycle}d</div></div>
                      <div><div className="text-white/40 mb-0.5">Yield</div><div className="text-white">{crop.yieldPerSqM} kg/m²</div></div>
                      <div><div className="text-white/40 mb-0.5">Difficulty</div><div className="text-white">{'★'.repeat(crop.difficulty)}{'☆'.repeat(5 - crop.difficulty)}</div></div>
                    </div>
                    <p className="text-xs text-white/50">{crop.notes}</p>
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
              <h2 className="text-3xl text-white mb-1">Hydroponic Systems</h2>
              <p className="text-white/50 text-sm">Five main approaches — each with different trade-offs in cost, complexity, and crop suitability.</p>
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
                        <span className="text-amber-400">{sys.cost} cost</span>
                        <span className="text-white/40">Difficulty: {'●'.repeat(sys.difficulty)}{'○'.repeat(5 - sys.difficulty)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{sys.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <div className="text-xs text-white/40 mb-2">Best for</div>
                      <div className="flex flex-wrap gap-1">
                        {sys.bestFor.map(c => <span key={c} className="bg-green-500/10 text-green-400 rounded-md text-[11px] font-thin px-[12px] py-[6px]">{c}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-2">Pros</div>
                      <ul className="space-y-1">{sys.pros.map(p => <li key={p} className="text-xs text-white/60">+ {p}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-2">Cons</div>
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
              <h2 className="text-3xl text-white mb-1">Growing Fundamentals</h2>
              <p className="text-white/50 text-sm">The core concepts every hydroponic grower needs to understand — regardless of system type or scale.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fundamentals.map(f => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
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
              <div className="text-white/60 text-sm">More guides, affiliate links, and supplier resources coming soon.</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
