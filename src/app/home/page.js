"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, getProfile, signOut } from "@/lib/auth";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import MessagesTab from "@/components/tabs/MessagesTab";
import NotificationsTab from "@/components/tabs/NotificationsTab";
import SettingsTab from "@/components/tabs/SettingsTab";

const TABS = [
  { id: "projects", label: "팀플", icon: "⊞" },
  { id: "messages", label: "개인메세지", icon: "✉" },
  { id: "notifications", label: "알림", icon: "🔔" },
  { id: "settings", label: "설정", icon: "⚙" },
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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleThemeUpdate = (theme_bg, theme_accent) => {
    setProfile((prev) => ({ ...prev, theme_bg, theme_accent }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  const accentColor = profile?.theme_accent ?? "#2563eb";
  const bgColor = profile?.theme_bg ?? "#ffffff";

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: bgColor }}>
      {/* 좌측 사이드바 */}
      <aside className="w-16 sm:w-56 flex flex-col border-r border-gray-200 bg-white shrink-0">
        {/* 로고 */}
        <div className="px-4 py-5 border-b border-gray-100">
          <h1 className="hidden sm:block text-lg font-bold text-gray-900">Teamver</h1>
          <span className="sm:hidden block text-center text-lg font-bold text-gray-900">T</span>
        </div>

        {/* 탭 목록 */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                style={active ? { backgroundColor: accentColor } : {}}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 유저 정보 + 로그아웃 */}
        <div className="p-3 border-t border-gray-100">
          <div className="hidden sm:flex items-center gap-2 px-2 py-1.5 mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">{profile?.username}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors hidden sm:block"
          >
            로그아웃
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center text-gray-400 hover:text-gray-600 py-1 sm:hidden"
            title="로그아웃"
          >
            ↩
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "projects" && (
          <ProjectsTab userId={userId} accentColor={accentColor} />
        )}
        {activeTab === "messages" && <MessagesTab accentColor={accentColor} />}
        {activeTab === "notifications" && <NotificationsTab accentColor={accentColor} />}
        {activeTab === "settings" && (
          <SettingsTab
            userId={userId}
            profile={profile}
            onThemeUpdate={handleThemeUpdate}
          />
        )}
      </main>
    </div>
  );
}
