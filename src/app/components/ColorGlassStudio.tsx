import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

type ColorHarmony = 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';

export function ColorGlassStudio() {
  const [baseHue, setBaseHue] = useState(280);
  const [baseSaturation, setBaseSaturation] = useState(80);
  const [baseLightness, setBaseLightness] = useState(60);
  const [harmony, setHarmony] = useState<ColorHarmony>('monochromatic');
  const [colors, setColors] = useState<string[]>([]);

  // Glass properties
  const [blur, setBlur] = useState(24);
  const [opacity, setOpacity] = useState(0.12);
  const [borderOpacity, setBorderOpacity] = useState(0.25);
  const [saturation, setSaturation] = useState(2);

  // Grain properties
  const [grainIntensity, setGrainIntensity] = useState(0.1);
  const [grainSize, setGrainSize] = useState(1.2);

  // Gradient animation
  const [animationSpeed, setAnimationSpeed] = useState(10);

  // Calculate color harmonies
  useEffect(() => {
    const generateColors = () => {
      const baseColor = `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`;

      switch (harmony) {
        case 'monochromatic':
          return [
            `hsl(${baseHue}, ${Math.max(20, baseSaturation - 30)}%, ${Math.max(30, baseLightness - 20)}%)`,
            `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`,
            `hsl(${baseHue}, ${Math.min(100, baseSaturation + 10)}%, ${Math.min(80, baseLightness + 15)}%)`,
          ];

        case 'complementary':
          return [
            baseColor,
            `hsl(${(baseHue + 180) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
          ];

        case 'analogous':
          return [
            `hsl(${(baseHue - 30 + 360) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
            baseColor,
            `hsl(${(baseHue + 30) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
          ];

        case 'triadic':
          return [
            baseColor,
            `hsl(${(baseHue + 120) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
            `hsl(${(baseHue + 240) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
          ];

        case 'split-complementary':
          return [
            baseColor,
            `hsl(${(baseHue + 150) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
            `hsl(${(baseHue + 210) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
          ];

        case 'tetradic':
          return [
            baseColor,
            `hsl(${(baseHue + 90) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
            `hsl(${(baseHue + 180) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
            `hsl(${(baseHue + 270) % 360}, ${baseSaturation}%, ${baseLightness}%)`,
          ];

        default:
          return [baseColor];
      }
    };

    setColors(generateColors());
  }, [baseHue, baseSaturation, baseLightness, harmony]);

  // Generate grain filter
  const grainFilter = `
    <svg width="0" height="0">
      <filter id="glassGrain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="${grainSize * 0.65}"
          numOctaves="3"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="saturate"
          values="0"
          result="desaturatedNoise"
        />
        <feComponentTransfer in="desaturatedNoise" result="grain">
          <feFuncA type="linear" slope="${grainIntensity}" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
      </filter>
    </svg>
  `;

  return (
    <div className="w-screen h-screen flex font-mono">
      {/* Control Panel - Left Sidebar */}
      <aside className="w-[18vw] min-w-[280px] max-w-[320px] shrink-0 bg-black/30 backdrop-blur-2xl border-r border-white/5 flex flex-col">
        {/* Header */}
        <header className="px-5 py-4 border-b border-white/5 shrink-0">
          <h1 className="text-lg font-light tracking-wide text-white mb-0.5">
            GLASS STUDIO
          </h1>
          <p className="text-[10px] font-light text-white/40 tracking-wider uppercase">
            Liquid Effects
          </p>
        </header>

        {/* Controls - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Color Harmony */}
          <div>
            <h3 className="text-[10px] font-light tracking-widest uppercase text-white/50 mb-3">Harmony</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(['monochromatic', 'complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic'] as ColorHarmony[]).map((h) => (
                <button
                  key={h}
                  onClick={() => setHarmony(h)}
                  className={`px-2.5 py-1.5 rounded text-[9px] font-light tracking-wide uppercase transition-all ${
                    harmony === h
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {h.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <h3 className="text-[10px] font-light tracking-widest uppercase text-white/50 mb-3">Base Color</h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Hue</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={baseHue}
                  onChange={(e) => setBaseHue(Number(e.target.value))}
                  className="w-full h-1"
                  style={{
                    background: `linear-gradient(to right,
                      hsl(0, 80%, 60%),
                      hsl(60, 80%, 60%),
                      hsl(120, 80%, 60%),
                      hsl(180, 80%, 60%),
                      hsl(240, 80%, 60%),
                      hsl(300, 80%, 60%),
                      hsl(360, 80%, 60%)
                    )`
                  }}
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{baseHue}°</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Saturation</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={baseSaturation}
                  onChange={(e) => setBaseSaturation(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{baseSaturation}%</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Lightness</label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={baseLightness}
                  onChange={(e) => setBaseLightness(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{baseLightness}%</div>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {colors.map((color, i) => (
                <div
                  key={i}
                  className="aspect-square rounded border border-white/10 shadow-lg"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Glass Properties */}
          <div>
            <h3 className="text-[10px] font-light tracking-widest uppercase text-white/50 mb-3">Glass</h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Blur</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{blur}px</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{opacity.toFixed(2)}</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Border</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={borderOpacity}
                  onChange={(e) => setBorderOpacity(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{borderOpacity.toFixed(2)}</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Saturation</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{saturation.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Texture & Animation */}
          <div>
            <h3 className="text-[10px] font-light tracking-widest uppercase text-white/50 mb-3">Texture</h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Grain Intensity</label>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.01"
                  value={grainIntensity}
                  onChange={(e) => setGrainIntensity(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{grainIntensity.toFixed(2)}</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Grain Size</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={grainSize}
                  onChange={(e) => setGrainSize(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{grainSize.toFixed(1)}</div>
              </div>

              <div>
                <label className="text-[9px] font-light tracking-wider uppercase text-white/40 mb-1.5 block">Animation Speed</label>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  className="w-full h-1"
                />
                <div className="text-[9px] font-light text-white/30 mt-1">{animationSpeed}s</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Preview Stage - Right Side */}
      <main className="flex-1 relative overflow-hidden">
        {/* SVG Filter for grain */}
        <div dangerouslySetInnerHTML={{ __html: grainFilter }} />

        {/* Animated gradient background */}
        <div className="absolute inset-0">
          {colors.map((color, i) => {
            const positions = [
              { x: [0, 100, 0], y: [0, 150, 0], scale: [1, 1.2, 1] },
              { x: [0, -80, 0], y: [0, -120, 0], scale: [1, 1.3, 1] },
              { x: [0, 50, 0], y: [0, 80, 0], scale: [1.2, 1, 1.2] },
              { x: [0, -60, 0], y: [0, 100, 0], scale: [1, 1.4, 1] },
            ];

            const pos = positions[i % positions.length];

            return (
              <motion.div
                key={i}
                className="absolute w-[600px] h-[600px] rounded-full"
                style={{
                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                  left: `${i * 25}%`,
                  top: `${i * 20}%`,
                  opacity: 0.8,
                }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  scale: pos.scale,
                }}
                transition={{
                  duration: animationSpeed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
              />
            );
          })}
        </div>

        {/* Glass cards */}
        <div className="absolute inset-0 flex items-center justify-center gap-[3vw] p-[5vh] pointer-events-none">
          <div className="flex items-center justify-center gap-[3vw] pointer-events-auto">
          <motion.div
            className="relative rounded-2xl p-[3vh] w-[22vw] min-w-[280px] max-w-[380px]"
            style={{
              background: `rgba(255, 255, 255, ${opacity})`,
              backdropFilter: `blur(${blur}px) saturate(${saturation})`,
              WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
              border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              filter: 'url(#glassGrain)',
            }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="text-white/50 text-[9px] font-light tracking-widest uppercase mb-2">Heart Rate</div>
            <div className="text-[5vw] md:text-6xl font-light text-white mb-0.5 leading-none">142</div>
            <div className="text-sm font-light text-white/60 mb-4 tracking-wide">BPM</div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/50"
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>
            <div className="mt-4 text-[9px] font-light text-white/40 tracking-wider uppercase">Zone 3 — Aerobic</div>
          </motion.div>

          <motion.div
            className="relative rounded-2xl p-[3vh] w-[22vw] min-w-[280px] max-w-[380px]"
            style={{
              background: `rgba(0, 0, 0, ${opacity * 0.6})`,
              backdropFilter: `blur(${blur}px) saturate(${saturation})`,
              WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
              border: `1px solid rgba(255, 255, 255, ${borderOpacity * 0.6})`,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              filter: 'url(#glassGrain)',
            }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="text-white/50 text-[9px] font-light tracking-widest uppercase mb-2">Calories</div>
            <div className="text-[5vw] md:text-6xl font-light text-white mb-0.5 leading-none">2,847</div>
            <div className="text-sm font-light text-white/60 mb-4 tracking-wide">KCAL</div>
            <div className="flex items-end gap-0.5 h-20">
              {[65, 45, 75, 55, 85, 70, 90, 60, 80, 95].map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-white/30 rounded-sm"
                  style={{ height: `${height}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
