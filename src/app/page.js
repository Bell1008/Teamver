"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("초대 코드를 입력해주세요."); return; }

    const res = await fetch(`/api/join/${trimmed}`);
    if (!res.ok) { setError("유효하지 않은 코드입니다."); return; }
    router.push(`/join/${trimmed}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Teamver</h1>
        <p className="text-gray-500 text-sm">AI와 함께 완성하는 학생 팀플 협업 도구</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* 팀플 만들기 */}
        <button
          onClick={() => router.push("/projects/new")}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors"
        >
          팀플 만들기
          <p className="text-xs font-normal opacity-80 mt-0.5">프로젝트 생성 후 초대 코드 발급</p>
        </button>

        {/* 참여하기 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="font-semibold text-gray-800 mb-3">참여하기</p>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm tracking-widest font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="초대 코드 6자리 입력"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full border-2 border-blue-600 text-blue-600 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              팀플 참여하기
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
