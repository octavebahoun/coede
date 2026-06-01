import React, { useState } from "react";
import { Search, Bell, Settings, Award, Cpu, RefreshCw, X, Sparkles } from "lucide-react";

interface HeaderProps {
  onSearchChange?: (val: string) => void;
  onGoProClick?: () => void;
  openSettings?: () => void;
  proPassUnlocked?: boolean;
}

export default function Header({ onSearchChange, onGoProClick, openSettings, proPassUnlocked }: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const notifications = [
    { id: 1, text: "Félicitations ! Votre code pour 'Neural Pathfinding' a dépassé 94% d'efficacité.", type: "success", time: "Il y a 2h" },
    { id: 2, text: "Nouveau défi disponible : Token Context Expansion (Niveau Avancé).", type: "info", time: "Il y a 5h" },
    { id: 3, text: "La saison 12 d'arène de duels commence bientôt ! Préparez vos algorithmes.", type: "warning", time: "Hier" }
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <header className="w-full h-20 bg-[#09090b] border-b border-[#27272a] px-10 flex justify-between items-center shrink-0 z-10 sticky top-0">
      {/* Search Input */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher des défis ou des projets..."
            value={searchValue}
            onChange={handleSearch}
            className="bg-[#121214] border border-[#27272a] text-[#fafafa] placeholder-zinc-500 font-sans text-xs rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#52525b] focus:ring-1 focus:ring-zinc-805 transition-all w-72"
          />
        </div>
      </div>

      {/* Center Nav Options (explorer, console, terminal, history representation) */}
      <nav className="hidden lg:flex items-center gap-8 h-full text-xs font-semibold tracking-wide uppercase select-none">
        <span className="text-[#fafafa] border-b-2 border-emerald-500 h-full flex items-center px-1 cursor-default">
          Explorer
        </span>
        <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer h-full flex items-center px-1">
          Console
        </span>
        <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer h-full flex items-center px-1">
          Terminal
        </span>
        <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer h-full flex items-center px-1">
          Historique
        </span>
      </nav>

      {/* Trailing actions */}
      <div className="flex items-center gap-4 relative">
        {/* Go Pro Premium CTA */}
        {proPassUnlocked ? (
          <div className="px-4 py-2 border border-emerald-500 bg-emerald-500/20 text-[#DAF1DE] text-xs font-bold rounded uppercase tracking-tighter flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] select-none">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-bounce" />
            <span>Élite Pro Actif</span>
          </div>
        ) : (
          <button 
            onClick={onGoProClick}
            className="px-4 py-2 border border-emerald-900/50 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded uppercase tracking-tighter hover:bg-emerald-500/15 transition-all text-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Passer Pro</span>
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={() => setShowNotificationModal(!showNotificationModal)}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/40 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer relative"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>

        {/* Settings button */}
        <button
          onClick={openSettings}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/40 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
        >
          <Settings className="w-4.5 h-4.5 animate-spin-slow" />
        </button>

        {/* Avatar badge */}
        <div className="flex items-center gap-2 border-l border-[#27272a] pl-4">
          <div className="w-8 h-8 rounded-full border border-[#27272a] bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
            <img
              alt="User Avatar"
              className="w-full h-full object-cover grayscale contrast-125"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZymiT42t-KbyZBIGa7_sgs9hcRwdVtrtQwk1ddrc3uRWIvLJz9RxRQdr-QBHYI47aMHC5m_FwnHUhM-PYFPKWMbYqao7k-oi3jM_cXFpeg1PUpLFQpzV14NWAHsGz6o8LJvZjm3smBJVu61x4px-ojGgMws7TF8SD3LiIunJIPXawI7f5ryyHNK3CRf65FkYK2gsmwvSsqxgz_u3OiXfE3046aTLvZ8p3pAjPtENjEOepLPZ7w1YntI6Zvwp4ZqL7Lg260W0HKis"
            />
          </div>
          <div className="hidden xl:flex flex-col text-[11px] select-none leading-none">
            <span className="font-bold text-zinc-100">GuillaumeD</span>
            <span className="text-zinc-500 mt-1">Diamant III</span>
          </div>
        </div>

        {/* Notification Modal Popover */}
        {showNotificationModal && (
          <div className="absolute right-12 top-14 font-sans bg-[#121214] border border-[#27272a] rounded-xl p-4 w-80 premium-glow z-50">
            <div className="flex justify-between items-center border-b border-[#27272a]/40 pb-2 mb-3">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Notifications
              </span>
              <button onClick={() => setShowNotificationModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs">
                  <p className="text-zinc-200 leading-relaxed">{notif.text}</p>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
