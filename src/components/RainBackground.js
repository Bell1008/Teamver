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

    // 빗방울 생성
    const drops = Array.from({ length: 180 }, () => spawnDrop(canvas));

    // 파문 목록
    const ripples = [];

    function spawnDrop(c) {
      return {
        x: Math.random() * c.width * 1.3,
        y: -60 - Math.random() * c.height * 0.5,
        speed: 7 + Math.random() * 9,
        len: 14 + Math.random() * 22,
        opacity: 0.18 + Math.random() * 0.38,
        w: 0.5 + Math.random() * 1.2,
      };
    }

    function spawnRipple(x, y) {
      ripples.push({ x, y, r: 1, maxR: 18 + Math.random() * 28, opacity: 0.55, rx: 1.8 });
    }

    function drawPuddles(c, ctx) {
      const count = 5;
      for (let i = 0; i < count; i++) {
        const px = (c.width / (count + 1)) * (i + 1) + Math.sin(i * 7) * 60;
        const py = c.height - 18 - Math.sin(i * 3) * 8;
        const rw = 40 + i * 25 + Math.sin(i) * 15;
        const rh = 4 + Math.sin(i * 2) * 2;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, rw);
        grad.addColorStop(0, "rgba(96, 165, 250, 0.35)");
        grad.addColorStop(0.6, "rgba(59, 130, 246, 0.18)");
        grad.addColorStop(1, "rgba(37, 99, 235, 0)");

        ctx.beginPath();
        ctx.ellipse(px, py, rw, rh, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 웅덩이
      drawPuddles(canvas, ctx);

      // 빗방울
      drops.forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.speed * 0.18, d.y + d.len);
        ctx.strokeStyle = `rgba(147, 197, 253, ${d.opacity})`;
        ctx.lineWidth = d.w;
        ctx.lineCap = "round";
        ctx.stroke();

        d.y += d.speed;
        d.x -= d.speed * 0.18;

        if (d.y > canvas.height + 10) {
          if (Math.random() > 0.55) spawnRipple(d.x, canvas.height - 10 - Math.random() * 30);
          Object.assign(d, spawnDrop(canvas));
          d.x = Math.random() * canvas.width * 1.3;
          d.y = -20;
        }
      });

      // 파문
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r * r.rx, r.r * 0.32, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(147, 197, 253, ${r.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        r.r += 0.9;
        r.opacity -= 0.022;
        if (r.opacity <= 0 || r.r > r.maxR) ripples.splice(i, 1);
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

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
