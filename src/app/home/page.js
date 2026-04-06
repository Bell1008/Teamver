"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, getProfile, signOut } from "@/lib/auth";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import MessagesTab from "@/components/tabs/MessagesTab";
import NotificationsTab from "@/components/tabs/NotificationsTab";
import SettingsTab from "@/components/tabs/SettingsTab";

const ACCENT = "#2563eb";

const Icons = {
  projects: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  messages: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  notifications: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  settings: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  logout: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
};

const TABS = [
  { id: "projects",      label: "팀플",      icon: Icons.projects },
  { id: "messages",      label: "개인메세지", icon: Icons.messages },
  { id: "notifications", label: "알림",      icon: Icons.notifications },
  { id: "settings",      label: "설정",      icon: Icons.settings },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("projects");
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) { router.replace("/"); return; }
      setUserId(session.user.id);
      const p = await getProfile(session.user.id);
      setProfile(p);
      setLoading(false);
    });
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center page-water">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f4f8ff" }}>
      {/* 좌측 사이드바 */}
      <aside className="w-16 sm:w-56 flex flex-col shrink-0 border-r bg-white" style={{ borderColor: "rgba(37,99,235,0.08)", boxShadow: "2px 0 16px rgba(37,99,235,0.04)" }}>
        {/* 로고 */}
        <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(37,99,235,0.07)" }}>
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-7 h-8 flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(145deg, ${ACCENT}, #1d4ed8)`, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", boxShadow: `0 4px 12px rgba(37,99,235,0.35)` }}>
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 1C6 1 2 5.5 2 8.5C2 10.99 3.79 13 6 13C8.21 13 10 10.99 10 8.5C10 5.5 6 1 6 1Z" fill="white"/></svg>
            </div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Teamver</h1>
          </div>
          <div className="sm:hidden flex justify-center">
            <div className="w-8 h-9 flex items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${ACCENT}, #1d4ed8)`, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}>
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 1C6 1 2 5.5 2 8.5C2 10.99 3.79 13 6 13C8.21 13 10 10.99 10 8.5C10 5.5 6 1 6 1Z" fill="white"/></svg>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="btn-jelly w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active ? { backgroundColor: `rgba(37,99,235,0.1)`, color: ACCENT, boxShadow: `inset 0 0 0 1px rgba(37,99,235,0.15)` } : { color: "#6b7280" }}>
                <span className="shrink-0">{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
                {active && <span className="hidden sm:block ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />}
              </button>
            );
          })}
        </nav>

        {/* 유저 */}
        <div className="p-3 border-t" style={{ borderColor: "rgba(37,99,235,0.07)" }}>
          <div className="hidden sm:flex items-center gap-2.5 px-2 py-1.5 mb-1 rounded-xl">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow: `0 2px 8px rgba(37,99,235,0.3)` }}>
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">{profile?.username}</span>
          </div>
          <button onClick={() => { signOut(); router.replace("/"); }}
            className="btn-jelly w-full hidden sm:flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            {Icons.logout}<span>로그아웃</span>
          </button>
          <button onClick={() => { signOut(); router.replace("/"); }}
            className="btn-jelly w-full flex justify-center sm:hidden text-gray-400 hover:text-gray-600 py-1 rounded-lg">
            {Icons.logout}
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "projects"      && <ProjectsTab userId={userId} accentColor={ACCENT} />}
        {activeTab === "messages"      && <MessagesTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "settings"      && <SettingsTab profile={profile} />}
      </main>
    </div>
  );
}
