"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, getProfile, signOut } from "@/lib/auth";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import MessagesTab from "@/components/tabs/MessagesTab";
import NotificationsTab from "@/components/tabs/NotificationsTab";
import SettingsTab from "@/components/tabs/SettingsTab";
import MyInfoTab from "@/components/tabs/MyInfoTab";

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

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab]   = useState("projects");
  const [userId, setUserId]         = useState(null);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [dmTarget, setDmTarget]     = useState(null);
  const [unreadDm, setUnreadDm]     = useState(0);     // 미읽 DM 수 → 탭 배지
  const [unreadNotif, setUnreadNotif] = useState(0);   // 미읽 알림 수 → 탭 배지

  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) { router.replace("/"); return; }
      setUserId(session.user.id);
      const p = await getProfile(session.user.id);
      setProfile(p);
      setLoading(false);
    });
  }, [router]);

  // URL 파라미터로 DM 바로 열기
  useEffect(() => {
    const tab  = searchParams.get("tab");
    const dm   = searchParams.get("dm");
    const name = searchParams.get("name");
    if (tab) setActiveTab(tab);
    if (dm)  setDmTarget({ partnerId: dm, partnerName: name ?? "팀원" });
  }, [searchParams]);

  // 탭 열리면 해당 배지 초기화
  useEffect(() => { if (activeTab === "messages")      setUnreadDm(0); }, [activeTab]);
  useEffect(() => { if (activeTab === "notifications") setUnreadNotif(0); }, [activeTab]);

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
            const badge  = tab.id === "messages" && unreadDm > 0 ? unreadDm
                         : tab.id === "notifications" && unreadNotif > 0 ? unreadNotif
                         : 0;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="btn-jelly w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active ? { backgroundColor: `rgba(37,99,235,0.1)`, color: ACCENT, boxShadow: `inset 0 0 0 1px rgba(37,99,235,0.15)` } : { color: "#6b7280" }}>
                <span className="relative shrink-0">
                  {tab.icon}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="hidden sm:block">{tab.label}</span>
                {badge > 0 && !active && <span className="hidden sm:block ml-auto w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />}
                {active && badge === 0 && <span className="hidden sm:block ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />}
              </button>
            );
          })}
        </nav>

        {/* 유저 — 클릭 시 내 정보 이동 */}
        <div className="p-3 border-t" style={{ borderColor: "rgba(37,99,235,0.07)" }}>
          <button onClick={() => setActiveTab("profile")}
            className="btn-jelly hidden sm:flex w-full items-center gap-2.5 px-2 py-1.5 mb-1 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow: `0 2px 8px rgba(37,99,235,0.3)` }}>
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-sm text-gray-700 font-medium truncate flex-1">{profile?.username}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </button>
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
        {activeTab === "messages"      && <MessagesTab userId={userId} initialPartnerId={dmTarget?.partnerId} initialPartnerName={dmTarget?.partnerName} onUnreadChange={setUnreadDm} />}
        {activeTab === "notifications" && <NotificationsTab userId={userId} accentColor={ACCENT} onUnreadChange={setUnreadNotif} />}
        {activeTab === "settings"      && <SettingsTab />}
        {activeTab === "profile"       && <MyInfoTab profile={profile} userId={userId} onProfileUpdate={setProfile} />}
      </main>
    </div>
  );
}

export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center page-water"><div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin"/></div>}>
      <HomePage />
    </Suspense>
  );
}
