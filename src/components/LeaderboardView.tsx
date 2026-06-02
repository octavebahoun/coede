import { authFetch } from "../utils/api";
import React, { useState, useEffect } from "react";
import { Award, Trophy, Users, Search, Target, Flame, RefreshCw } from "lucide-react";

interface LeaderboardUser {
  username: string;
  email: string;
  avatar: string;
  level: number;
  totalScore: number;
  wins: number;
  losses: number;
  provider: string;
}

interface LeaderboardViewProps {
  currentUserEmail?: string;
}

export default function LeaderboardView({ currentUserEmail }: LeaderboardViewProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/api/users/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Erreur de récupération du classement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUserEmail]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow overflow-y-auto p-8 select-none max-w-7xl mx-auto w-full font-sans">
      
      {/* Title block */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-[#DAF1DE] tracking-tight uppercase mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-emerald-400" />
            <span>Classement Global</span>
          </h2>
          <p className="text-sm font-medium text-brand-muted max-w-xl">
            Mesurez-vous à l'élite mondiale de CodeArena. Les scores sont mis à jour en temps réel après chaque évaluation de défi ou arène.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="bg-brand-active/50 text-brand-primary border border-brand-border/60 text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer hover:border-brand-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Podium Top 3 */}
      {!loading && filteredUsers.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* #2 Rank Card */}
          {filteredUsers[1] && (
            <div className="bg-brand-surface/40 border border-brand-border/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative order-2 md:order-1 mt-6">
              <div className="absolute top-4 left-4 bg-zinc-800 text-zinc-300 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-zinc-700">
                2
              </div>
              <img
                src={filteredUsers[1].avatar}
                alt={filteredUsers[1].username}
                className="w-16 h-16 rounded-full border-2 border-zinc-500 mb-3 object-cover"
                referrerPolicy="no-referrer"
              />
              <h3 className="font-bold text-[#DAF1DE] text-lg">{filteredUsers[1].username}</h3>
              <p className="text-xs text-brand-muted mb-2 font-mono">{filteredUsers[1].email}</p>
              <div className="flex gap-2 items-center text-xs bg-zinc-900/60 border border-brand-border/30 px-3 py-1 rounded-full text-zinc-300 font-mono">
                <span>Niveau {filteredUsers[1].level}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{filteredUsers[1].totalScore} XP</span>
              </div>
            </div>
          )}

          {/* #1 Champion Card */}
          {filteredUsers[0] && (
            <div className="bg-brand-surface border border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative order-1 md:order-2 premium-glow shadow-[0_0_30px_rgba(16,185,129,0.15)] transform scale-105">
              <div className="absolute -top-4 bg-emerald-500 text-black font-mono text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 fill-black" />
                <span>Champion</span>
              </div>
              <img
                src={filteredUsers[0].avatar}
                alt={filteredUsers[0].username}
                className="w-20 h-20 rounded-full border-4 border-emerald-500 mb-4 object-cover"
                referrerPolicy="no-referrer"
              />
              <h3 className="font-extrabold text-[#DAF1DE] text-xl">{filteredUsers[0].username}</h3>
              <p className="text-xs text-emerald-400 font-semibold mb-3 font-mono">{filteredUsers[0].email}</p>
              <div className="flex gap-2 items-center text-sm bg-brand-darkest border border-emerald-500/20 px-4 py-1.5 rounded-full text-white font-mono shadow-sm">
                <span>Niveaux {filteredUsers[0].level}</span>
                <span>•</span>
                <span className="text-emerald-400 font-extrabold">{filteredUsers[0].totalScore} XP</span>
              </div>
            </div>
          )}

          {/* #3 Rank Card */}
          {filteredUsers[2] && (
            <div className="bg-brand-surface/40 border border-brand-border/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative order-3 mt-6">
              <div className="absolute top-4 left-4 bg-[#562f1d] text-amber-500 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-amber-950">
                3
              </div>
              <img
                src={filteredUsers[2].avatar}
                alt={filteredUsers[2].username}
                className="w-16 h-16 rounded-full border-2 border-[#562f1d] mb-3 object-cover"
                referrerPolicy="no-referrer"
              />
              <h3 className="font-bold text-[#DAF1DE] text-lg">{filteredUsers[2].username}</h3>
              <p className="text-xs text-brand-muted mb-2 font-mono">{filteredUsers[2].email}</p>
              <div className="flex gap-2 items-center text-xs bg-zinc-900/60 border border-brand-border/30 px-3 py-1 rounded-full text-zinc-300 font-mono">
                <span>Niveau {filteredUsers[2].level}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{filteredUsers[2].totalScore} XP</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Rechercher un joueur par son pseudo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none w-full font-medium"
        />
      </div>

      {/* Ranking List Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-medium flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm">Synchronisation avec la base de données CodeArena...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-medium font-sans">
            Aucun joueur trouvé correspondant à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#235347]/20 bg-brand-darkest/40 text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">
                  <th className="py-4 px-6 text-center w-16">Rang</th>
                  <th className="py-4 px-6">Joueur</th>
                  <th className="py-4 px-6 text-center">Niveau</th>
                  <th className="py-4 px-6 text-center">Score Global</th>
                  <th className="py-4 px-6 text-center">Ratio Duels (V/D)</th>
                  <th className="py-4 px-6 text-right">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#235347]/10 font-sans text-sm">
                {filteredUsers.map((user, idx) => {
                  const isSelf = user.email === currentUserEmail;
                  return (
                    <tr
                      key={user.email}
                      className={`hover:bg-[#121214]/35 transition-colors ${
                        isSelf ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""
                      }`}
                    >
                      {/* Rank number */}
                      <td className="py-4 px-6 text-center font-mono font-bold text-zinc-300">
                        {idx + 1 === 1 ? (
                          <span className="text-yellow-400">★ 1</span>
                        ) : idx + 1 === 2 ? (
                          <span className="text-zinc-400">★ 2</span>
                        ) : idx + 1 === 3 ? (
                          <span className="text-amber-600">★ 3</span>
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* Avatar and Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className={`w-9 h-9 rounded-full object-cover border ${
                              isSelf ? "border-emerald-400" : "border-brand-border"
                            }`}
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                              <span>{user.username}</span>
                              {isSelf && (
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                                  Vous
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-4 px-6 text-center font-bold font-mono text-emerald-400">
                        {user.level}
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 text-center font-bold font-mono text-[#DAF1DE]">
                        {user.totalScore} XP
                      </td>

                      {/* Duels Victory/Loss */}
                      <td className="py-4 px-6 text-center font-mono text-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-emerald-400 font-bold">{user.wins}V</span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-red-400 font-bold">{user.losses}D</span>
                        </div>
                      </td>

                      {/* Login Provider tag */}
                      <td className="py-4 px-6 text-right">
                        <span className="text-[10px] font-mono font-bold uppercase py-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                          {user.provider}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
