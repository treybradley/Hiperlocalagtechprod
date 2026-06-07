import { motion } from 'motion/react';
import { useState } from 'react';

export function GlassMorphism() {
  const [blur, setBlur] = useState(20);
  const [opacity, setOpacity] = useState(0.15);
  const [borderOpacity, setBorderOpacity] = useState(0.3);
  const [saturation, setSaturation] = useState(1.8);
  const [grainIntensity, setGrainIntensity] = useState(0.08);
  const [grainSize, setGrainSize] = useState(1.5);

  // Generate grain pattern using SVG filter
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
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      {/* SVG Filter for grain */}
      <div dangerouslySetInnerHTML={{ __html: grainFilter }} />

      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,0,110,0.8) 0%, rgba(131,56,236,0.6) 50%, transparent 70%)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 150, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(58,134,255,0.8) 0%, rgba(6,255,165,0.6) 50%, transparent 70%)',
            right: 0,
            bottom: 0,
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, -120, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-72 h-72 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,200,0,0.7) 0%, rgba(255,100,100,0.5) 50%, transparent 70%)',
            left: '40%',
            top: '30%',
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
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
          <h3 className="text-2xl font-bold text-white mb-2">Glass Card</h3>
          <p className="text-white/80 text-sm">Premium liquid glass effect</p>
          <div className="mt-4 h-20 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20" />
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
          <h3 className="text-2xl font-bold text-white mb-2">Dark Glass</h3>
          <p className="text-white/80 text-sm">Premium frosted effect</p>
          <div className="mt-4 h-20 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10" />
        </motion.div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md p-4 space-y-2">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-4">
            <label className="text-xs text-white/70 w-28">Blur</label>
            <input
              type="range"
              min="0"
              max="50"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/50 w-12">{blur}px</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-white/70 w-28">Grain Intensity</label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={grainIntensity}
              onChange={(e) => setGrainIntensity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/50 w-12">{grainIntensity.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-white/70 w-28">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/50 w-12">{opacity.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-white/70 w-28">Grain Size</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={grainSize}
              onChange={(e) => setGrainSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/50 w-12">{grainSize.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-white/70 w-28">Border</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={borderOpacity}
              onChange={(e) => setBorderOpacity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/50 w-12">{borderOpacity.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-white/70 w-28">Saturation</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/50 w-12">{saturation.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
