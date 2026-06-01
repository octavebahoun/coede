import React from "react";
import { 
  Trophy, 
  Award, 
  Activity, 
  Mail, 
  UserCheck, 
  CheckCircle, 
  Flame, 
  Share2, 
  MapPin, 
  Grid 
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { UserStats } from "../types";

interface ProfileViewProps {
  stats: UserStats;
}

export default function ProfileView({ stats }: ProfileViewProps) {
  // Stats arrays formatted for Recharts LineChart
  const data = stats.recentScores.map((score, index) => ({
    name: `Défis ${index + 1}`,
    score: score
  }));

  const achievements = [
    { title: "Maître du Pathfinding", description: "Atteindre une efficacité de 94% sur Neural Pathfinding.", icon: Award, unlocked: true },
    { title: "Légende Temporelle", description: "Avoir résolu un défi dans la dernière minute du compte à rebours.", icon: Flame, unlocked: true },
    { title: "Diamant Poli", description: "Franchir le palier du rang Diamant III en arène de duels.", icon: Trophy, unlocked: true },
    { title: "Esprit Clairvoyant", description: "Soumettre 5 algorithmes d'affilée sans aucune erreur de syntaxe statique.", icon: CheckCircle, unlocked: false }
  ];

  const levelPercent = Math.min(((stats.totalScore % 500) / 500) * 100, 100);

  return (
    <div className="flex-grow overflow-y-auto p-8 select-none max-w-7xl mx-auto w-full font-sans">
      
      {/* Title block */}
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-extrabold text-[#DAF1DE] tracking-tight uppercase mb-2">Profil & Statut</h2>
          <p className="text-sm font-medium text-brand-muted max-w-xl">
            Suivez d'un coup d'œil l'activité de vos algorithmes, vos victoires récentes en duel, ainsi que l'historique complet de votre score.
          </p>
        </div>
        
        {/* Share profile placeholder */}
        <button className="bg-brand-active/50 text-brand-primary border border-brand-border/60 text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer hover:border-brand-primary transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Partager Profil</span>
        </button>
      </div>

      {/* Grid: Bio details and progression */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        
        {/* User Stats Card (4 columns) */}
        <div className="col-span-12 lg:col-span-4 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col items-center text-center hover:border-brand-muted/70 transition-colors duration-300 premium-glow">
          <div className="w-24 h-24 rounded-full border-2 border-brand-primary p-1 relative mb-4">
            <div className="absolute inset-0 rounded-full border border-brand-primary animate-ping opacity-10"></div>
            <img 
              alt="Votre Avatar" 
              className="w-full h-full object-cover rounded-full filter grayscale contrast-125"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZymiT42t-KbyZBIGa7_sgs9hcRwdVtrtQwk1ddrc3uRWIvLJz9RxRQdr-QBHYI47aMHC5m_FwnHUhM-PYFPKWMbYqao7k-oi3jM_cXFpeg1PUpLFQpzV14NWAHsGz6o8LJvZjm3smBJVu61x4px-ojGgMws7TF8SD3LiIunJIPXawI7f5ryyHNK3CRf65FkYK2gsmwvSsqxgz_u3OiXfE3046aTLvZ8p3pAjPtENjEOepLPZ7w1YntI6Zvwp4ZqL7Lg260W0HKis"
            />
            <div className="absolute -bottom-1 -right-1 bg-brand-primary border border-brand-border rounded-full p-1 shadow-md">
              <Award className="w-4 h-4 text-brand-darkest fill-brand-darkest" />
            </div>
          </div>

          <h3 className="font-extrabold text-xl text-[#DAF1DE] tracking-tight">GuillaumeD</h3>
          <span className="text-xs font-bold text-brand-muted font-mono bg-brand-darkest px-3 py-1 rounded-full border border-brand-border/30 mt-1.5 uppercase tracking-wide">
            Rang : Diamant III
          </span>

          <div className="w-full border-t border-brand-border/40 my-4 pt-4 flex flex-col gap-2.5 text-xs text-brand-muted text-left">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-muted" />
              <span>teamexellence@gmail.com</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-muted" />
              <span>Paris, France</span>
            </div>
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-brand-muted" />
              <span>Membre d'élite depuis v2.4.0</span>
            </div>
          </div>

          {/* Level Progress meter */}
          <div className="w-full mt-2 text-left">
            <div className="flex justify-between items-center text-xs text-[#DAF1DE] font-bold mb-1.5 font-mono">
              <span>Niveau {stats.level}</span>
              <span className="text-brand-muted">{stats.totalScore % 500} / 500 XP</span>
            </div>
            <div className="w-full bg-brand-darkest h-2 rounded-full overflow-hidden border border-brand-border/30">
              <div 
                className="h-full bg-brand-primary shadow-[0_0_10px_rgba(218,241,222,0.4)] transition-all duration-700" 
                style={{ width: `${levelPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Telemetry rechart scores graph (8 columns) */}
        <div className="col-span-12 lg:col-span-8 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col hover:border-brand-muted/70 transition-colors duration-300 premium-glow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" />
              <span>Historique d'Évolution d'Arène</span>
            </h3>
            <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider font-bold">Variabilité score</span>
          </div>

          {/* Recharts responsive layout */}
          <div className="flex-1 min-h-[220px]" style={{ width: "100%" }}>
            <ResponsiveContainer width="100%" height="95%">
              <LineChart data={data}>
                <CartesianGrid stroke="#235347" strokeDasharray="3 3" opacity={0.25} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8EB69B" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#8EB69B" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#0B2B26", 
                    borderColor: "#235347", 
                    borderRadius: "8px",
                    color: "#DAF1DE",
                    fontFamily: "monospace",
                    fontSize: "11px"
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#DAF1DE" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, stroke: "#051F20", strokeWidth: 1.5, fill: "#DAF1DE" }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Numerical Quick Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 select-none font-mono text-center">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-muted/5 w-full">
          <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">VIC-DUELS</p>
          <p className="text-3xl font-extrabold text-brand-primary">{stats.wins}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-muted/5 w-full">
          <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">DEF-DUELS</p>
          <p className="text-3xl font-extrabold text-brand-primary">{stats.losses}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-muted/5 w-full">
          <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">DÉFIS FAITS</p>
          <p className="text-3xl font-extrabold text-brand-primary">{stats.challengesDone}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-brand-muted/5 w-full">
          <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">SCORE TOTAL</p>
          <p className="text-3xl font-extrabold text-brand-primary">{stats.totalScore}</p>
        </div>
      </div>

      {/* Grid Achievements collection section */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-muted/70 transition-colors duration-300 premium-glow">
        <h3 className="font-bold text-base text-brand-primary mb-5 flex items-center gap-2">
          <Grid className="w-4 h-4 text-brand-primary" />
          <span>Hauts Faits Débloqués</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                  item.unlocked 
                    ? "bg-brand-active/20 border-brand-border/40 text-brand-primary" 
                    : "bg-brand-surface border-brand-border/30 opacity-50 grayscale"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${item.unlocked ? "bg-brand-primary/20 text-brand-primary" : "bg-brand-darkest text-brand-muted"} shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h4 className="text-xs font-bold font-sans flex items-center gap-2 text-[#DAF1DE]">
                    <span>{item.title}</span>
                    {item.unlocked && <span className="text-[10px] bg-[#1a4439] text-[#DAF1DE] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-widest scale-95">Acquis</span>}
                  </h4>
                  <p className="text-[11px] text-brand-muted leading-relaxed font-sans mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
