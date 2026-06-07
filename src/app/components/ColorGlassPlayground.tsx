import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

type ColorHarmony = 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';

interface ColorStop {
  color: string;
  position: number;
}

export function ColorGlassPlayground() {
  const [baseHue, setBaseHue] = useState(280);
  const [baseSaturation, setBaseSaturation] = useState(80);
  const [baseLightness, setBaseLightness] = useState(60);
  const [harmony, setHarmony] = useState<ColorHarmony>('monochromatic');
  const [colors, setColors] = useState<string[]>([]);

  // Glass properties
  const [blur, setBlur] = useState(20);
  const [opacity, setOpacity] = useState(0.15);
  const [borderOpacity, setBorderOpacity] = useState(0.3);
  const [saturation, setSaturation] = useState(1.8);

  // Grain properties
  const [grainIntensity, setGrainIntensity] = useState(0.08);
  const [grainSize, setGrainSize] = useState(1.5);

  // Gradient animation
  const [animationSpeed, setAnimationSpeed] = useState(8);

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
    <div className="space-y-6">
      {/* Color Harmony Selector */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Color Harmony</h3>
        <div className="flex flex-wrap gap-2">
          {(['monochromatic', 'complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic'] as ColorHarmony[]).map((h) => (
            <button
              key={h}
              onClick={() => setHarmony(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                harmony === h
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              {h.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Base Color Controls */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={baseHue}
              onChange={(e) => setBaseHue(Number(e.target.value))}
              className="flex-1"
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
            <span className="text-sm text-white/50 w-12">{baseHue}°</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              value={baseSaturation}
              onChange={(e) => setBaseSaturation(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-12">{baseSaturation}%</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Lightness</label>
            <input
              type="range"
              min="30"
              max="80"
              value={baseLightness}
              onChange={(e) => setBaseLightness(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-12">{baseLightness}%</span>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="mt-6 flex gap-3">
          {colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 h-16 rounded-lg border-2 border-white/20 shadow-lg"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Glass Morphism Preview</h3>

        <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
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
                  className="absolute w-96 h-96 rounded-full"
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
          <div className="absolute inset-0 flex items-center justify-center gap-6 p-8">
            <motion.div
              className="relative rounded-2xl p-8 min-w-[280px]"
              style={{
                background: `rgba(255, 255, 255, ${opacity})`,
                backdropFilter: `blur(${blur}px) saturate(${saturation})`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
                border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                filter: 'url(#glassGrain)',
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Metrics</h3>
              <p className="text-white/80 text-sm mb-4">Heart Rate Zone</p>
              <div className="text-4xl font-bold text-white mb-2">142</div>
              <div className="text-sm text-white/60">BPM</div>
              <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/60"
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
            </motion.div>

            <motion.div
              className="relative rounded-2xl p-8 min-w-[280px]"
              style={{
                background: `rgba(0, 0, 0, ${opacity * 0.5})`,
                backdropFilter: `blur(${blur}px) saturate(${saturation})`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
                border: `1px solid rgba(255, 255, 255, ${borderOpacity * 0.5})`,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                filter: 'url(#glassGrain)',
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Activity</h3>
              <p className="text-white/80 text-sm mb-4">Calories Burned</p>
              <div className="text-4xl font-bold text-white mb-2">2,847</div>
              <div className="text-sm text-white/60">KCAL</div>
              <div className="mt-4 flex items-end gap-1 h-16">
                {[65, 45, 75, 55, 85, 70, 90, 60, 80, 95].map((height, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-white/40 rounded-sm"
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
      </div>

      {/* Glass Properties */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Glass Properties</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Blur</label>
            <input
              type="range"
              min="0"
              max="50"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{blur}px</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Opacity</label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{opacity.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Border Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={borderOpacity}
              onChange={(e) => setBorderOpacity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{borderOpacity.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Saturation</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{saturation.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Grain & Animation */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Texture & Animation</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Grain Intensity</label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={grainIntensity}
              onChange={(e) => setGrainIntensity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{grainIntensity.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Grain Size</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={grainSize}
              onChange={(e) => setGrainSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{grainSize.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70 w-32">Animation Speed</label>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/50 w-16">{animationSpeed}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
