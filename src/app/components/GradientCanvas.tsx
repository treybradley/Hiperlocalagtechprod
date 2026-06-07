import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45);
  const [blur, setBlur] = useState(0);
  const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>('normal');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Convert angle to radians
    const rad = (angle * Math.PI) / 180;
    const x1 = canvas.width / 2 - Math.cos(rad) * canvas.width / 2;
    const y1 = canvas.height / 2 - Math.sin(rad) * canvas.height / 2;
    const x2 = canvas.width / 2 + Math.cos(rad) * canvas.width / 2;
    const y2 = canvas.height / 2 + Math.sin(rad) * canvas.height / 2;

    // Apply blur
    ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none';

    // Main gradient
    const gradient1 = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient1.addColorStop(0, '#FF006E');
    gradient1.addColorStop(0.3, '#8338EC');
    gradient1.addColorStop(0.6, '#3A86FF');
    gradient1.addColorStop(1, '#06FFA5');

    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay radial gradient
    ctx.globalCompositeOperation = blendMode;
    const radialGradient = ctx.createRadialGradient(
      canvas.width * 0.3,
      canvas.height * 0.3,
      0,
      canvas.width * 0.3,
      canvas.height * 0.3,
      canvas.width * 0.6
    );
    radialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    radialGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.2)');
    radialGradient.addColorStop(1, 'rgba(255, 0, 110, 0)');

    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Second radial gradient
    const radialGradient2 = ctx.createRadialGradient(
      canvas.width * 0.7,
      canvas.height * 0.7,
      0,
      canvas.width * 0.7,
      canvas.height * 0.7,
      canvas.width * 0.5
    );
    radialGradient2.addColorStop(0, 'rgba(131, 56, 236, 0.4)');
    radialGradient2.addColorStop(0.7, 'rgba(58, 134, 255, 0.2)');
    radialGradient2.addColorStop(1, 'rgba(6, 255, 165, 0)');

    ctx.fillStyle = radialGradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [angle, blur, blendMode]);

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
          <label className="text-sm text-white/70 w-32">Angle</label>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-white/50 w-12">{angle}°</span>
        </div>
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
          <span className="text-sm text-white/50 w-12">{blur}px</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/70 w-32">Blend Mode</label>
          <select
            value={blendMode}
            onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)}
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
            <option value="hard-light">Hard Light</option>
            <option value="soft-light">Soft Light</option>
            <option value="difference">Difference</option>
            <option value="exclusion">Exclusion</option>
          </select>
        </div>
      </div>
    </div>
  );
}
