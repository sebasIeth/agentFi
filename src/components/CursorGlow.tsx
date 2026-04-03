"use client";

import { useEffect, useRef } from "react";

interface Blob {
  el: HTMLDivElement | null;
  x: number;
  y: number;
  speed: number;
  offsetX: number;
  offsetY: number;
  size: number;
  color: string;
}

const BLOB_CONFIGS = [
  { size: 380, color: "rgba(55,138,221,0.18)", speed: 0.09, offsetX: 0, offsetY: 0 },
  { size: 320, color: "rgba(139,92,246,0.14)", speed: 0.04, offsetX: -120, offsetY: 80 },
  { size: 340, color: "rgba(16,185,129,0.12)", speed: 0.02, offsetX: 100, offsetY: -90 },
];

export default function CursorGlow() {
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blobs = useRef<Blob[]>([]);
  const mouse = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 500, y: 300 });

  useEffect(() => {
    blobs.current = BLOB_CONFIGS.map((cfg, i) => ({
      el: blobRefs.current[i],
      x: mouse.current.x + cfg.offsetX,
      y: mouse.current.y + cfg.offsetY,
      speed: cfg.speed,
      offsetX: cfg.offsetX,
      offsetY: cfg.offsetY,
      size: cfg.size,
      color: cfg.color,
    }));

    const handleMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    let animId: number;
    const animate = () => {
      blobs.current.forEach((blob, i) => {
        const targetX = mouse.current.x + blob.offsetX;
        const targetY = mouse.current.y + blob.offsetY;
        blob.x = lerp(blob.x, targetX, blob.speed);
        blob.y = lerp(blob.y, targetY, blob.speed);

        const el = blobRefs.current[i];
        if (el) {
          el.style.transform = `translate(${blob.x - blob.size / 2}px, ${blob.y - blob.size / 2}px)`;
        }
      });
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {BLOB_CONFIGS.map((cfg, i) => (
        <div
          key={i}
          ref={(el) => { blobRefs.current[i] = el; }}
          className="absolute rounded-full will-change-transform"
          style={{
            width: cfg.size,
            height: cfg.size,
            background: `radial-gradient(circle, ${cfg.color} 0%, transparent 65%)`,
            filter: "blur(10px)",
          }}
        />
      ))}
    </div>
  );
}
