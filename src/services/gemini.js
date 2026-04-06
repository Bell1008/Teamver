import { readFileSync } from "fs";
import { join } from "path";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
function getApiKey() { const k = process.env.GEMINI_API_KEY; if (!k) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다."); return k; }
function loadPrompt(f) { return readFileSync(join(process.cwd(), "prompts", f), "utf-8"); }
function extractJson(t) { const m = t.match(/\{[\s\S]*\}/); if (m) return m[0]; throw new Error("JSON 블록 없음"); }
async function callGemini(sys, user) {
  const r = await fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }) });
  if (!r.ok) throw new Error(`Gemini API 오류 (${r.status})`);
  return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
export async function callKickoffAgent(input) {
  const sys = loadPrompt("kickoff-agent.txt"), u = JSON.stringify(input);
  try { return JSON.parse(await callGemini(sys, u)); } catch { try { return JSON.parse(extractJson(await callGemini(sys, u))); } catch { return buildKickoffFallback(input); } }
}
export async function callWeeklyReviewAgent(input) {
  const sys = loadPrompt("weekly-review-agent.txt"), u = JSON.stringify(input);
  try { return JSON.parse(await callGemini(sys, u)); } catch { try { return JSON.parse(extractJson(await callGemini(sys, u))); } catch { throw new Error("이번 주 리뷰를 생성하지 못했습니다."); } }
}
function buildKickoffFallback(input) {
  const members = input.members ?? [], roles = ["기획 & PM","프론트엔드","백엔드","디자인","QA"], w = input.project?.duration_weeks ?? 4;
  return { role_assignments: members.map((m,i) => ({ member_name: m.name, role: roles[i%roles.length], responsibilities: ["역할을 직접 수정해주세요."] })), milestones: Array.from({length:w},(_,i) => ({ week:i+1, title:`${i+1}주차 마일스톤`, tasks:["태스크를 직접 입력해주세요."] })), ai_member_config: [] };
}
