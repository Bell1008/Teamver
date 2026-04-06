"use client";

import { useState } from "react";

export default function ContributionForm({ projectId, members, myMemberId, accentColor = "#2563eb", onSubmit }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ member_id: myMemberId ?? "", taskInput: "", memo: "", achievement_rate: 1 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.member_id || !form.taskInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: form.member_id,
          project_id: projectId,
          completed_tasks: form.taskInput.split("\n").map((t) => t.trim()).filter(Boolean),
          memo: form.memo,
          achievement_rate: Number(form.achievement_rate),
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setForm({ member_id: myMemberId ?? "", taskInput: "", memo: "", achievement_rate: 1 });
      onSubmit?.();
      setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
    } catch {
      alert("입력 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">오늘의 기여 입력</h2>
        <button onClick={() => setOpen(!open)} className="text-sm font-medium" style={{ color: accentColor }}>
          {open ? "닫기" : "입력하기"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* 본인 멤버가 지정되지 않은 경우 (방장이 대리 입력) 선택 허용 */}
          {!myMemberId && (
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.member_id}
              onChange={(e) => setForm({ ...form, member_id: e.target.value })}
              required
            >
              <option value="">팀원 선택</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}

          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            placeholder={"완료한 작업 (줄바꿈으로 구분)\n예: 로그인 UI 구현\n    API 연동 테스트"}
            rows={3}
            value={form.taskInput}
            onChange={(e) => setForm({ ...form, taskInput: e.target.value })}
            required
          />

          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="메모 (선택)"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">오늘 달성률</label>
            <input type="range" min="0" max="1" step="0.25" value={form.achievement_rate}
              onChange={(e) => setForm({ ...form, achievement_rate: e.target.value })} className="flex-1" />
            <span className="text-sm font-medium w-10 text-right">{Math.round(form.achievement_rate * 100)}%</span>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            {success ? "저장 완료!" : loading ? "저장 중..." : "기여 저장"}
          </button>
        </form>
      )}
    </section>
  );
}
