"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, getSession } from "@/lib/auth";
import RainBackground from "@/components/RainBackground";

export default function Landing() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSession().then((s) => { if (s) router.replace("/home"); });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.password) { setError("아이디와 비밀번호를 입력해주세요."); return; }
    if (mode === "signup" && form.password !== form.confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (mode === "signup" && form.password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (!/^[a-z0-9_]+$/i.test(form.username.trim())) { setError("아이디는 영문·숫자·언더스코어만 사용 가능합니다."); return; }

    setLoading(true);
    try {
      if (mode === "signup") await signUp(form.username, form.password);
      else await signIn(form.username, form.password);
      router.push("/home");
    } catch (err) {
      const msg = err.message ?? "";
      if (msg.includes("already registered")) setError("이미 사용 중인 아이디입니다.");
      else if (msg.includes("Invalid login")) setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      else setError(msg || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #0c1e3c 40%, #0f2a52 70%, #0a1628 100%)",
      }}
    >
      {/* 빗소리 배경 캔버스 */}
      <RainBackground />

      {/* 배경 글로우 */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      {/* 바닥 웅덩이 반사 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ zIndex: 2 }}>
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(to top, rgba(59,130,246,0.08) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* 카드 */}
      <div className="relative w-full max-w-sm" style={{ zIndex: 10 }}>
        {/* 로고 */}
        <div className="text-center mb-8 animate-float-drop">
          {/* 물방울 아이콘 */}
          <div className="flex justify-center mb-4">
            <div
              className="w-14 h-14 flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, rgba(59,130,246,0.9), rgba(37,99,235,0.7))",
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                boxShadow: "0 8px 32px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z" fill="white" opacity="0.9"/>
                <path d="M9 15.5C9 13.5 10.5 12 12 11" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
          </div>
          <h1
            className="text-3xl font-bold mb-1.5 tracking-tight"
            style={{
              background: "linear-gradient(135deg, #e0f2fe, #bfdbfe, #93c5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Teamver
          </h1>
          <p className="text-sm text-blue-300/60">AI와 함께 완성하는 팀플 협업 도구</p>
        </div>

        {/* 유리 카드 */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(147,197,253,0.15)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* 탭 */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {[["login", "로그인"], ["signup", "회원가입"]].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="btn-jelly flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={
                  mode === m
                    ? {
                        background: "rgba(59,130,246,0.85)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
                      }
                    : { color: "rgba(147,197,253,0.7)" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-blue-200/70 mb-1.5 tracking-wide uppercase">아이디</label>
              <input
                className="input-drop w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-300/30 border"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(147,197,253,0.2)",
                }}
                placeholder="영문·숫자·언더스코어"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-200/70 mb-1.5 tracking-wide uppercase">비밀번호</label>
              <input
                type="password"
                className="input-drop w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-300/30 border"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(147,197,253,0.2)",
                }}
                placeholder="6자 이상"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-blue-200/70 mb-1.5 tracking-wide uppercase">비밀번호 확인</label>
                <input
                  type="password"
                  className="input-drop w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-300/30 border"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderColor: "rgba(147,197,253,0.2)",
                  }}
                  placeholder="비밀번호 재입력"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
              </div>
            )}

            {error && (
              <p
                className="text-xs rounded-xl px-3 py-2"
                style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-jelly w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 mt-2"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow: "0 4px 20px rgba(59,130,246,0.45)",
              }}
            >
              {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>
        </div>

        {/* 하단 물방울 장식 */}
        <div className="flex justify-center gap-3 mt-6">
          {[0.6, 1, 0.7].map((s, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: `${8 * s}px`,
                height: `${10 * s}px`,
                background: "rgba(147,197,253,0.25)",
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
