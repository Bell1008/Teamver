"use client";

import { useState } from "react";

export default function WeeklyReviewButton({ projectId, currentWeek }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleReview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, week: currentWeek }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || "리뷰 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="font-semibold text-gray-800">주간 리뷰</h2>
          <p className="text-xs text-gray-400 mt-0.5">{currentWeek}주차 AI 진단 및 다음 주 우선순위</p>
        </div>
        <button
          onClick={handleReview}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "분석 중..." : "주간 리뷰 실행"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">진단</p>
            <p className="text-sm text-gray-700">{result.diagnosis}</p>
          </div>

          {result.risks?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-600 mb-2">리스크</p>
              <ul className="space-y-1">
                {result.risks.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {result.priorities?.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-2">다음 주 우선순위</p>
              <div className="space-y-2">
                {result.priorities.map((p, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-gray-800">{p.member_name}</p>
                    <ul className="ml-3 space-y-0.5">
                      {(p.focus_tasks ?? []).map((t, j) => (
                        <li key={j} className="text-xs text-gray-600">• {t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
