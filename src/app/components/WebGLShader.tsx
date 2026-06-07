import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ShaderProps {
  type: 'plasma' | 'liquid' | 'aurora' | 'metallic';
}

export function WebGLShader({ type }: ShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(600, 400);
    containerRef.current.appendChild(renderer.domElement);

    const getShader = () => {
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `;

      let fragmentShader = '';

      if (type === 'plasma') {
        fragmentShader = `
          uniform float time;
          varying vec2 vUv;

          void main() {
            vec2 p = vUv * 10.0;
            float v = 0.0;

            v += sin(p.x + time);
            v += sin(p.y + time * 0.7);
            v += sin(p.x + p.y + time * 0.5);

            p += vec2(sin(time * 0.3), cos(time * 0.4)) * 2.0;
            v += sin(sqrt(p.x * p.x + p.y * p.y) + time);

            v *= 0.5;

            vec3 col = vec3(
              sin(v * 3.14159 + time),
              sin(v * 3.14159 + time + 2.094),
              sin(v * 3.14159 + time + 4.188)
            );

            gl_FragColor = vec4(col * 0.5 + 0.5, 1.0);
          }
        `;
      } else if (type === 'liquid') {
        fragmentShader = `
          uniform float time;
          varying vec2 vUv;

          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            float dist = length(uv);

            vec2 offset = vec2(
              sin(time * 0.5 + uv.y * 5.0) * 0.1,
              cos(time * 0.3 + uv.x * 5.0) * 0.1
            );

            vec2 distorted = uv + offset;
            float wave = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;

            vec3 color1 = vec3(0.1, 0.5, 1.0);
            vec3 color2 = vec3(1.0, 0.2, 0.8);
            vec3 color3 = vec3(0.2, 1.0, 0.6);

            vec3 col = mix(color1, color2, wave);
            col = mix(col, color3, sin(time + dist * 3.0) * 0.5 + 0.5);

            float highlight = smoothstep(0.4, 0.0, length(distorted - vec2(0.2, 0.2)));
            col += vec3(highlight * 0.3);

            gl_FragColor = vec4(col, 1.0);
          }
        `;
      } else if (type === 'aurora') {
        fragmentShader = `
          uniform float time;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;

            float wave1 = sin(uv.x * 3.0 + time) * 0.3;
            float wave2 = sin(uv.x * 5.0 - time * 0.7) * 0.2;
            float wave3 = sin(uv.x * 7.0 + time * 0.5) * 0.1;

            float y = uv.y + wave1 + wave2 + wave3;

            vec3 color1 = vec3(0.2, 1.0, 0.8);
            vec3 color2 = vec3(0.8, 0.2, 1.0);
            vec3 color3 = vec3(1.0, 0.9, 0.3);

            float band1 = smoothstep(0.3, 0.5, y) - smoothstep(0.5, 0.7, y);
            float band2 = smoothstep(0.4, 0.6, y) - smoothstep(0.6, 0.8, y);
            float band3 = smoothstep(0.5, 0.7, y) - smoothstep(0.7, 0.9, y);

            vec3 col = color1 * band1 + color2 * band2 + color3 * band3;
            col *= 1.5;

            gl_FragColor = vec4(col, 1.0);
          }
        `;
      } else if (type === 'metallic') {
        fragmentShader = `
          uniform float time;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            vec2 center = vec2(sin(time * 0.5) * 0.3, cos(time * 0.3) * 0.3);

            float dist = length(uv - center);
            float angle = atan(uv.y - center.y, uv.x - center.x);

            float ripple = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
            float spin = sin(angle * 8.0 + time * 2.0) * 0.5 + 0.5;

            vec3 baseColor = vec3(0.7, 0.7, 0.8);
            vec3 highlightColor = vec3(1.0, 1.0, 1.0);
            vec3 darkColor = vec3(0.2, 0.2, 0.3);

            vec3 col = mix(darkColor, baseColor, ripple);
            col = mix(col, highlightColor, spin * 0.3);

            float shine = pow(1.0 - dist, 4.0) * 0.5;
            col += vec3(shine);

            gl_FragColor = vec4(col, 1.0);
          }
        `;
      }

      return { vertexShader, fragmentShader };
    };

    const { vertexShader, fragmentShader } = getShader();

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    const animate = () => {
      material.uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border border-white/20"
    />
  );
}
