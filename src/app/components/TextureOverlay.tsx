import { motion } from 'motion/react';
import { useState } from 'react';

export function TextureOverlay() {
  const [grainIntensity, setGrainIntensity] = useState(0.15);
  const [grainSize, setGrainSize] = useState(1);

  // Generate grain pattern using SVG filter
  const grainFilter = `
    <svg width="0" height="0">
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="${grainSize * 0.8}"
          numOctaves="4"
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
        <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
      </filter>
    </svg>
  `;

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      {/* SVG Filter */}
      <div dangerouslySetInnerHTML={{ __html: grainFilter }} />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900" />

      {/* Content with texture */}
      <div className="absolute inset-0 p-8" style={{ filter: 'url(#grain)' }}>
        <div className="relative h-full flex flex-col gap-6">
          {/* Metric Card 1 */}
          <motion.div
            className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-white/60 text-sm mb-2">Active Calories</div>
            <div className="text-5xl font-bold text-white">2,847</div>
            <div className="mt-4 flex items-end gap-1">
              {[65, 45, 75, 55, 85, 70, 90, 60, 80, 95].map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-sm"
                  style={{ height: `${height}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Metric Card 2 */}
          <motion.div
            className="relative bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-white/60 text-sm mb-2">Heart Rate Zone</div>
            <div className="flex items-baseline gap-2">
              <div className="text-5xl font-bold text-white">142</div>
              <div className="text-2xl text-white/60">BPM</div>
            </div>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Metric Card 3 */}
          <motion.div
            className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-white/60 text-sm mb-2">Movement Quality</div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="10"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#circleGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 * (1 - 0.88) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06FFA5" />
                      <stop offset="100%" stopColor="#8338EC" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                  88
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/50 mb-1">Excellent form</div>
                <div className="text-sm text-white/80">Optimal range of motion</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md p-4 space-y-2">
        <div className="flex items-center gap-4">
          <label className="text-xs text-white/70 w-32">Grain Intensity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={grainIntensity}
            onChange={(e) => setGrainIntensity(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-white/50 w-12">{grainIntensity.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-white/70 w-32">Grain Size</label>
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
      </div>
    </div>
  );
}
