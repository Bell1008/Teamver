"use client";

import { useEffect, useRef } from "react";

// 세련된 일렁이는 파도 + 부유 글로우 배경
export default function RainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── 파도 레이어 정의 ──────────────────────────────
    const waves = [
      { amp: 38,  freq: 0.0016, speed: 0.00055, yRatio: 0.62, color: "rgba(59,130,246,0.07)",  lineW: 1.5 },
      { amp: 28,  freq: 0.0022, speed: 0.00080, yRatio: 0.65, color: "rgba(99,102,241,0.06)",  lineW: 1.2 },
      { amp: 50,  freq: 0.0011, speed: 0.00040, yRatio: 0.58, color: "rgba(37,99,235,0.05)",   lineW: 1.8 },
      { amp: 22,  freq: 0.0030, speed: 0.00110, yRatio: 0.70, color: "rgba(147,197,253,0.05)", lineW: 1.0 },
      { amp: 60,  freq: 0.0008, speed: 0.00028, yRatio: 0.80, color: "rgba(30,64,175,0.06)",   lineW: 2.0 },
    ];

    // ── 부유 글로우 오브 ──────────────────────────────
    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     120 + Math.random() * 180,
      dx:    (Math.random() - 0.5) * 0.18,
      dy:    (Math.random() - 0.5) * 0.14,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0004 + Math.random() * 0.0003,
      color: ["59,130,246","99,102,241","37,99,235","147,197,253","30,64,175"][i],
    }));

    let t = 0;

    function drawWave(wave, w, h, t) {
      const baseY = h * wave.yRatio;
      ctx.beginPath();
      ctx.moveTo(0, baseY);

      for (let x = 0; x <= w; x += 3) {
        const y = baseY
          + Math.sin(x * wave.freq + t * wave.speed * 60000) * wave.amp
          + Math.sin(x * wave.freq * 1.7 + t * wave.speed * 60000 * 0.6) * (wave.amp * 0.3);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = wave.color;
      ctx.lineWidth   = wave.lineW;
      ctx.stroke();
    }

    function drawOrb(orb, t) {
      // 부드러운 위아래 부유
      const floatY = Math.sin(t * orb.speed * 60000 + orb.phase) * 30;
      const x = orb.x;
      const y = orb.y + floatY;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, orb.r);
      grad.addColorStop(0,   `rgba(${orb.color}, 0.055)`);
      grad.addColorStop(0.5, `rgba(${orb.color}, 0.025)`);
      grad.addColorStop(1,   `rgba(${orb.color}, 0)`);

      ctx.beginPath();
      ctx.arc(x, y, orb.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 오브 천천히 이동 (벽 반사)
      orb.x += orb.dx;
      orb.y += orb.dy;
      if (orb.x < -orb.r)                    orb.x = canvas.width  + orb.r;
      if (orb.x > canvas.width  + orb.r)     orb.x = -orb.r;
      if (orb.y < -orb.r)                    orb.y = canvas.height + orb.r;
      if (orb.y > canvas.height + orb.r)     orb.y = -orb.r;
    }

    // ── 수면 반사 파티클 ──────────────────────────────
    const sparks = Array.from({ length: 18 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     0.5 * window.innerHeight + (Math.random() - 0.5) * window.innerHeight * 0.6,
      size:  0.8 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0006 + Math.random() * 0.0008,
      op:    0.15 + Math.random() * 0.25,
    }));

    function drawSparks(t) {
      sparks.forEach((s) => {
        const alpha = s.op * (0.5 + 0.5 * Math.sin(t * s.speed * 60000 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
        ctx.fill();
      });
    }

    let last = 0;
    function animate(now) {
      const dt = (now - last) / 1000;
      last = now;
      t += dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 오브 먼저 (배경 글로우)
      orbs.forEach((o) => drawOrb(o, t));

      // 파도
      waves.forEach((w) => drawWave(w, canvas.width, canvas.height, t));

      // 반짝이는 점
      drawSparks(t);

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
