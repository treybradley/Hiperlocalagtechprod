import { Leaf, Droplets, Zap, TrendingUp, Users, Globe } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const pillars = [
  {
    icon: Leaf,
    title: 'Zero-Distance Produce',
    description: 'Grow food where it\'s consumed. Eliminate cold chains, cut spoilage, and serve ingredients harvested hours — not days — ago.',
  },
  {
    icon: Droplets,
    title: '95% Less Water',
    description: 'Closed-loop hydroponics recirculates water continuously. A fraction of the input, the same output.',
  },
  {
    icon: Zap,
    title: 'Year-Round Consistency',
    description: 'Controlled environments mean no seasonal gaps, no weather dependency, no supply uncertainty.',
  },
  {
    icon: TrendingUp,
    title: 'Measurable ROI',
    description: 'Every gram harvested, every peso spent, every cycle logged. Real operational data driving real financial decisions.',
  },
];

const timeline = [
  { year: '2024', event: 'Concept & first prototype system built in La Veleta, Tulum' },
  { year: '2025', event: 'First restaurant partner. 3 systems operational.' },
  { year: '2026', event: 'Hiperlocal platform launched. Open to all growers.' },
  { year: '2027', event: 'ESP32 hardware integration. Real-time monitoring goes live.' },
];

export function AboutSection() {
  return (
    <div className="bg-[#0a0a0a] min-h-full">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-20">

        {/* Hero statement */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl text-white tracking-tight leading-tight">
            Farming built for<br />
            <span className="text-green-400">where you live.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
            Hiperlocal is a platform for anyone who wants to grow food — in a restaurant kitchen, a hotel courtyard, a rooftop, or a spare room. We make it easy to design, track, and scale a hydroponic system using real data from your real operation.
          </p>
        </div>

        {/* Hero image */}
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200"
            alt="Hydroponic farm"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <div className="text-xs text-white/50 uppercase tracking-wider">Est. 2024</div>
            <div className="text-white">La Veleta, Tulum, Q.Roo</div>
          </div>
        </div>

        {/* Pillars */}
        <div>
          <h2 className="text-2xl text-white mb-8">Why hyperlocal farming works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map(p => (
              <div key={p.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <p.icon className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-white">{p.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-2xl text-white mb-8">Story so far</h2>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0" />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-white/10 my-2" />}
                </div>
                <div className={`pb-8 ${i === timeline.length - 1 ? '' : ''}`}>
                  <div className="text-xs text-green-400/80 uppercase tracking-wider mb-1">{item.year}</div>
                  <div className="text-white/80 text-sm">{item.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who it's for */}
        <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-3xl p-8 space-y-6">
          <h2 className="text-2xl text-white">Built for growers of all sizes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Leaf, label: 'Home growers', desc: 'Track a single system. Understand your real costs and yields.' },
              { icon: Users, label: 'Restaurant & hospitality', desc: 'Source hyperlocal produce. Control quality and supply consistency.' },
              { icon: Globe, label: 'Commercial farms', desc: 'Manage multiple systems, cycles, and ROI across your entire operation.' },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <item.icon className="w-5 h-5 text-green-400" />
                <div className="text-white text-sm">{item.label}</div>
                <div className="text-white/50 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap callout */}
        <div className="text-center space-y-4 pb-8">
          <div className="text-white/40 text-sm uppercase tracking-wider">What's coming</div>
          <div className="flex flex-wrap justify-center gap-3">
            {['ESP32 hardware integration', 'Real-time sensor monitoring', 'Multi-farm accounts', 'Affiliate plant suppliers', 'Community grow logs'].map(item => (
              <span key={item} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">{item}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

