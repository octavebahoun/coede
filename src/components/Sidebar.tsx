import React from "react";
import { 
  Home, 
  Code, 
  Trophy, 
  User, 
  Zap, 
  Terminal, 
  Plus, 
  HelpCircle, 
  BookOpen 
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onNewProject: () => void;
}

export default function Sidebar({ currentTab, setTab, onNewProject }: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Accueil", icon: Home },
    { id: "editor", label: "Éditeur", icon: Code },
    { id: "challenges", label: "Défis", icon: Trophy },
    { id: "profile", label: "Profil", icon: User },
    { id: "duels", label: "Duels", icon: Zap },
  ];

  return (
    <nav className="w-64 bg-[#09090b] border-r border-[#27272a] h-screen flex flex-col py-6 px-4 shrink-0 select-none z-20">
      {/* Brand logo & title */}
      <div className="mb-6 flex flex-col gap-1 px-2">
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-black text-xs italic">
            CA
          </div>
          <div>
            <h1 className="font-serif text-xl italic tracking-tight text-white leading-none">
              CodeArena
            </h1>
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
              v2.4.0
            </span>
          </div>
        </div>
      </div>

      {/* New Project CTA */}
      <button 
        onClick={onNewProject}
        className="w-full border border-emerald-950 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 font-sans text-xs py-2.5 px-4 rounded font-semibold uppercase tracking-wider flex items-center justify-center gap-2 mb-6 transition-all active:scale-[0.98] cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Nouveau Projet</span>
      </button>

      {/* Main navigation options */}
      <div className="flex-1 flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer font-sans text-sm text-left active:scale-[0.98] ${
                isActive 
                  ? "bg-[#18181b] text-emerald-400 font-medium" 
                  : "text-zinc-400 hover:bg-[#18181b] hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom links & profile card */}
      <div className="mt-auto flex flex-col gap-1 border-t border-[#27272a] pt-4">
        <button 
          onClick={() => setTab("docs")} 
          className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-[#18181b] rounded-lg text-left font-medium transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation</span>
        </button>
        <button 
          onClick={() => setTab("support")} 
          className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-[#18181b] rounded-lg text-left font-medium transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support</span>
        </button>

        {/* User profile card matching the template */}
        <div className="mt-4 pt-4 border-t border-[#27272a] flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-xs text-zinc-200">
            GD
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-100 truncate">GuillaumeD</p>
            <p className="text-[10px] text-zinc-500 truncate">Lead Fullstack</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
