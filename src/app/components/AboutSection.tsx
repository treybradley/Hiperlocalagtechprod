import { useMemo } from 'react';
import { Leaf, Droplets, Zap, TrendingUp, Users, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function AboutSection() {
  const { t } = useLanguage();

  const pillars = useMemo(() => [
    {
      icon: Leaf,
      title: t('about.pillar1Title'),
      description: t('about.pillar1Desc'),
    },
    {
      icon: Droplets,
      title: t('about.pillar2Title'),
      description: t('about.pillar2Desc'),
    },
    {
      icon: Zap,
      title: t('about.pillar3Title'),
      description: t('about.pillar3Desc'),
    },
    {
      icon: TrendingUp,
      title: t('about.pillar4Title'),
      description: t('about.pillar4Desc'),
    },
  ], [t]);

  const timeline = useMemo(() => [
    { year: '2024', event: t('about.timeline2024') },
    { year: '2025', event: t('about.timeline2025') },
    { year: '2026', event: t('about.timeline2026') },
    { year: '2027', event: t('about.timeline2027') },
  ], [t]);

  const audience = useMemo(() => [
    { icon: Leaf, label: t('about.homeLabel'), desc: t('about.homeDesc') },
    { icon: Users, label: t('about.hospitalityLabel'), desc: t('about.hospitalityDesc') },
    { icon: Globe, label: t('about.commercialLabel'), desc: t('about.commercialDesc') },
  ], [t]);

  const coming = useMemo(() => [
    t('about.coming1'),
    t('about.coming2'),
    t('about.coming3'),
    t('about.coming4'),
    t('about.coming5'),
  ], [t]);

  return (
    <div className="bg-[#0a0a0a] min-h-full">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-20">

        {/* Hero statement */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl text-white tracking-tight leading-tight">
            {t('about.title1')}<br />
            <span className="text-green-400">{t('about.title2')}</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
            {t('about.description')}
          </p>
        </div>

        {/* Hero image */}
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200"
            alt={t('about.imageAlt')}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <div className="text-xs text-white/50 uppercase tracking-wider">{t('about.est')}</div>
            <div className="text-white">{t('about.location')}</div>
          </div>
        </div>

        {/* Pillars */}
        <div>
          <h2 className="text-2xl text-white mb-8">{t('about.pillarsTitle')}</h2>
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
          <h2 className="text-2xl text-white mb-8">{t('about.storyTitle')}</h2>
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
          <h2 className="text-2xl text-white">{t('about.audienceTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {audience.map(item => (
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
          <div className="text-white/40 text-sm uppercase tracking-wider">{t('about.comingTitle')}</div>
          <div className="flex flex-wrap justify-center gap-3">
            {coming.map(item => (
              <span key={item} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">{item}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
