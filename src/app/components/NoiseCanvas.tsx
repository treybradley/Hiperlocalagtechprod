import { useEffect, useRef, useState } from 'react';
import { createNoise2D, createNoise3D } from 'simplex-noise';

interface NoiseCanvasProps {
  type: 'perlin' | 'turbulence' | 'ridged' | 'fbm';
  colorScheme: 'monochrome' | 'heat' | 'ocean' | 'sunset' | 'neon';
  animated?: boolean;
}

export function NoiseCanvas({ type, colorScheme, animated = false }: NoiseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(50);
  const [octaves, setOctaves] = useState(4);
  const [persistence, setPersistence] = useState(0.5);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise2D = createNoise2D();
    const noise3D = createNoise3D();
    const width = canvas.width;
    const height = canvas.height;
    let time = 0;

    const getColorFromValue = (value: number): string => {
      const normalized = (value + 1) / 2; // -1..1 to 0..1

      switch (colorScheme) {
        case 'monochrome':
          const gray = Math.floor(normalized * 255);
          return `rgb(${gray}, ${gray}, ${gray})`;

        case 'heat':
          const r = Math.floor(normalized * 255);
          const g = Math.floor(normalized * normalized * 200);
          const b = Math.floor((1 - normalized) * 100);
          return `rgb(${r}, ${g}, ${b})`;

        case 'ocean':
          const or = Math.floor(normalized * 100);
          const og = Math.floor(120 + normalized * 135);
          const ob = Math.floor(180 + normalized * 75);
          return `rgb(${or}, ${og}, ${ob})`;

        case 'sunset':
          const sr = Math.floor(200 + normalized * 55);
          const sg = Math.floor(normalized * 150);
          const sb = Math.floor((1 - normalized) * 200);
          return `rgb(${sr}, ${sg}, ${sb})`;

        case 'neon':
          const nr = Math.floor(Math.abs(Math.sin(normalized * Math.PI)) * 255);
          const ng = Math.floor(Math.abs(Math.sin(normalized * Math.PI * 2)) * 255);
          const nb = Math.floor(Math.abs(Math.cos(normalized * Math.PI)) * 255);
          return `rgb(${nr}, ${ng}, ${nb})`;

        default:
          return `rgb(0, 0, 0)`;
      }
    };

    const fbm = (x: number, y: number, t: number): number => {
      let total = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;

      for (let i = 0; i < octaves; i++) {
        total += noise3D(x * frequency, y * frequency, t) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }

      return total / maxValue;
    };

    const render = () => {
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const nx = x / scale;
          const ny = y / scale;
          let value: number;

          switch (type) {
            case 'perlin':
              value = animated ? noise3D(nx, ny, time) : noise2D(nx, ny);
              break;

            case 'turbulence':
              value = Math.abs(animated ? noise3D(nx, ny, time) : noise2D(nx, ny));
              break;

            case 'ridged':
              value = 1 - Math.abs(animated ? noise3D(nx, ny, time) : noise2D(nx, ny));
              break;

            case 'fbm':
              value = fbm(nx, ny, time);
              break;

            default:
              value = 0;
          }

          const color = getColorFromValue(value);
          const rgb = color.match(/\d+/g)!.map(Number);

          const idx = (y * width + x) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      if (animated) {
        time += 0.01;
        animationRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, colorScheme, scale, octaves, persistence, animated]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="rounded-lg border border-white/20"
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/70 w-24">Scale</label>
          <input
            type="range"
            min="10"
            max="200"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-white/50 w-12">{scale}</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/70 w-24">Octaves</label>
          <input
            type="range"
            min="1"
            max="8"
            value={octaves}
            onChange={(e) => setOctaves(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-white/50 w-12">{octaves}</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/70 w-24">Persistence</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={persistence}
            onChange={(e) => setPersistence(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-white/50 w-12">{persistence.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
