"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PERSONALITY_OPTIONS = ["꼼꼼하고 완성도를 중시", "논리적이고 문서화를 잘함", "창의적이고 아이디어가 많음", "리더십이 강하고 추진력 있음", "협력적이고 팀워크를 중시"];

function MemberCard({ member, index, onChange, onRemove }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm text-gray-700">팀원 {index + 1}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm">삭제</button>
      </div>
      <input
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        placeholder="이름"
        value={member.name}
        onChange={(e) => onChange({ ...member, name: e.target.value })}
      />
      <input
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        placeholder="보유 스킬 (쉼표로 구분, 예: React, Node.js)"
        value={member.skillsInput}
        onChange={(e) => onChange({ ...member, skillsInput: e.target.value })}
      />
      <select
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        value={member.personality}
        onChange={(e) => onChange({ ...member, personality: e.target.value })}
      >
        <option value="">성향 선택</option>
        {PERSONALITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [project, setProject] = useState({ title: "", goal: "", subject: "", duration_weeks: 4 });
  const [members, setMembers] = useState([{ name: "", skillsInput: "", personality: "" }]);
  const [addAiMember, setAddAiMember] = useState(false);

  const addMember = () => setMembers([...members, { name: "", skillsInput: "", personality: "" }]);
  const removeMember = (i) => setMembers(members.filter((_, idx) => idx !== i));
  const updateMember = (i, val) => setMembers(members.map((m, idx) => idx === i ? val : m));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const filledMembers = members.filter((m) => m.name.trim());
    if (!project.title || !project.goal || !project.subject) {
      setError("프로젝트 기본 정보를 모두 입력해주세요."); return;
    }
    if (filledMembers.length === 0) {
      setError("팀원을 최소 1명 이상 입력해주세요."); return;
    }

    setLoading(true);
    try {
      // 1. 프로젝트 생성
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, duration_weeks: Number(project.duration_weeks) }),
      });
      const projectData = await projectRes.json();
      if (!projectRes.ok) throw new Error(projectData.error);

      // 2. 킥오프 에이전트 호출
      const kickoffRes = await fetch("/api/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectData.id,
          project: { title: project.title, goal: project.goal, subject: project.subject, duration_weeks: Number(project.duration_weeks) },
          members: filledMembers.map((m) => ({
            name: m.name.trim(),
            skills: m.skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
            personality: m.personality,
          })),
          ai_members: addAiMember ? [{ role: "리서처", responsibilities: "자료 조사 및 정리" }] : [],
        }),
      });
      const kickoffData = await kickoffRes.json();
      if (!kickoffRes.ok) throw new Error(kickoffData.error);

      router.push(`/projects/${projectData.id}/kickoff`);
    } catch (err) {
      setError(err.message || "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">새 팀플 시작하기</h1>
        <p className="text-gray-500 text-sm mb-8">AI가 역할을 설계하고 마일스톤을 자동으로 만들어 드려요.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로젝트 기본 정보 */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">프로젝트 정보</h2>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="프로젝트 이름"
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
            />
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="프로젝트 목표 (한 줄 설명)"
              rows={2}
              value={project.goal}
              onChange={(e) => setProject({ ...project, goal: e.target.value })}
            />
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="과목명 (예: 모바일 프로그래밍)"
              value={project.subject}
              onChange={(e) => setProject({ ...project, subject: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">프로젝트 기간</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                value={project.duration_weeks}
                onChange={(e) => setProject({ ...project, duration_weeks: e.target.value })}
              >
                {[2, 3, 4, 6, 8, 12, 16].map((w) => (
                  <option key={w} value={w}>{w}주</option>
                ))}
              </select>
            </div>
          </section>

          {/* 팀원 */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">팀원</h2>
            {members.map((m, i) => (
              <MemberCard
                key={i}
                member={m}
                index={i}
                onChange={(val) => updateMember(i, val)}
                onRemove={() => removeMember(i)}
              />
            ))}
            <button type="button" onClick={addMember} className="w-full border border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
              + 팀원 추가
            </button>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addAiMember}
                onChange={(e) => setAddAiMember(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">AI 팀원 추가 (리서처 역할)</span>
            </label>
          </section>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "AI가 설계 중... (10~20초 소요)" : "AI로 역할 설계하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
