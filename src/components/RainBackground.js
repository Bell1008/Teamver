"use client";

import { useEffect, useRef } from "react";

// 아주 천천히 일렁이는 오로라 효과
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

    // 오로라 레이어 — 색상·위치·속도 모두 극도로 느리게
    const layers = [
      { hue: 200, sat: 70, baseY: 0.35, amp: 0.12, freq: 0.0008, speed: 0.00012, width: 0.55, alpha: 0.13 },
      { hue: 230, sat: 65, baseY: 0.50, amp: 0.10, freq: 0.0006, speed: 0.00009, width: 0.65, alpha: 0.10 },
      { hue: 260, sat: 60, baseY: 0.42, amp: 0.14, freq: 0.0010, speed: 0.00015, width: 0.50, alpha: 0.09 },
      { hue: 190, sat: 75, baseY: 0.60, amp: 0.08, freq: 0.0005, speed: 0.00008, width: 0.70, alpha: 0.08 },
      { hue: 215, sat: 80, baseY: 0.28, amp: 0.09, freq: 0.0012, speed: 0.00018, width: 0.45, alpha: 0.07 },
    ];

    let t = 0;
    let last = performance.now();

    function drawAuroraLayer(layer, w, h) {
      const cx  = w * 0.5;
      const cy  = h * layer.baseY + Math.sin(t * layer.speed * 60000 * 0.7) * h * 0.06;
      const rw  = w * layer.width;
      const rh  = h * layer.amp * (0.85 + 0.15 * Math.sin(t * layer.speed * 60000 * 1.3));

      // 위아래로 퍼지는 가우시안-느낌 방사형 그라디언트
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw * 0.9);
      const col = `hsla(${layer.hue + Math.sin(t * layer.speed * 60000 * 0.4) * 15}, ${layer.sat}%, 65%,`;
      grd.addColorStop(0,   `${col} ${layer.alpha})`);
      grd.addColorStop(0.4, `${col} ${layer.alpha * 0.55})`);
      grd.addColorStop(1,   `${col} 0)`);

      ctx.save();
      ctx.scale(1, rh / (rw * 0.9));  // 타원형으로 찌그러트림
      ctx.beginPath();
      ctx.ellipse(cx, cy / (rh / (rw * 0.9)), rw * 0.9, rw * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    }

    function animate(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 레이어를 뒤에서 앞으로 그리기
      layers.forEach((layer) => drawAuroraLayer(layer, canvas.width, canvas.height));

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
      style={{ zIndex: 1, mixBlendMode: "screen" }}
    />
  );
}
