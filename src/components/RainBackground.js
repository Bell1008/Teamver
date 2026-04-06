"use client";

import { useEffect, useRef } from "react";

export default function RainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 파문 목록
    const ripples = [];

    // 파문 생성 (한 지점에서 여러 겹 링)
    function spawnDrop(x, y) {
      const rings = 2 + Math.floor(Math.random() * 2); // 2~3겹
      for (let i = 0; i < rings; i++) {
        setTimeout(() => {
          ripples.push({
            x,
            y,
            r: 1,
            maxR: 28 + Math.random() * 30 + i * 8,
            opacity: 0.55 - i * 0.12,
            speed: 0.6 + Math.random() * 0.3,
            lineW: 1.2 - i * 0.25,
          });
        }, i * 70);
      }
    }

    // 톡톡 — 불규칙 간격으로 방울 생성
    let nextDrop = 0;
    function scheduleNext() {
      nextDrop = performance.now() + 400 + Math.random() * 1000;
    }
    scheduleNext();

    function animate(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 새 방울 스케줄
      if (now >= nextDrop) {
        const x = 60 + Math.random() * (canvas.width - 120);
        const y = 80 + Math.random() * (canvas.height - 160);
        spawnDrop(x, y);
        scheduleNext();
      }

      // 파문 그리기
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];

        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.38, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(147, 197, 253, ${rp.opacity})`;
        ctx.lineWidth = rp.lineW;
        ctx.stroke();

        // 중심 점 (아주 작게, 첫 프레임에만)
        if (rp.r < 4) {
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147, 197, 253, ${rp.opacity * 0.6})`;
          ctx.fill();
        }

        rp.r += rp.speed;
        rp.opacity -= 0.012;
        rp.lineW = Math.max(rp.lineW - 0.005, 0.3);

        if (rp.opacity <= 0 || rp.r > rp.maxR) {
          ripples.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
