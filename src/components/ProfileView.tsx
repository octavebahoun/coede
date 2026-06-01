import React, { useState } from "react";
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
  Grid,
  LogIn,
  Settings,
  Shield,
  Trash2,
  Check,
  RefreshCw,
  Cpu,
  Lock,
  User,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signOut,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";

interface ProfileViewProps {
  user: any | null;
  onLogin: (provider: string, email: string, username: string, avatar: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onUpdateMe: (updates: { username?: string; preferences?: any }) => Promise<void>;
  onDeleteMe: () => Promise<void>;
}

export default function ProfileView({ user, onLogin, onLogout, onUpdateMe, onDeleteMe }: ProfileViewProps) {
  // Input editing states
  const [editingUsername, setEditingUsername] = useState(user ? user.username : "");
  const [editorTheme, setEditorTheme] = useState(user?.preferences?.editorTheme || "vs-dark");
  const [preferredModel, setPreferredModel] = useState(user?.preferences?.aiModel || "gemini-3.5-flash");
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setSuccessMsg("");
    try {
      await onUpdateMe({
        username: editingUsername.trim(),
        preferences: {
          editorTheme,
          aiModel: preferredModel
        }
      });
      setSuccessMsg("Profil et préférences mis à jour avec succès en BDD !");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Real Firebase Auth credentials & views states
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Erreur de connexion.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      setAuthError("Veuillez remplir tous les champs !");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user) {
        await updateProfile(cred.user, {
          displayName: username.trim()
        });
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Erreur lors de la création du compte.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialSignIn = async (providerName: "google" | "github") => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const provider = providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setAuthError(
        `Échec de connexion via ${providerName === "google" ? "Google" : "GitHub"}. Veuillez vérifier que cette option est activée dans la console Firebase.`
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // If logged out, render a highly styled V2 Authentication layout
  if (!user) {
    return (
      <div className="flex-grow overflow-y-auto p-6 md:p-8 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-[#121214] border border-brand-border rounded-2xl p-6 md:p-8 premium-glow flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-[#DAF1DE] tracking-tight uppercase mb-1">Authentification Réelle</h2>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Connectez-vous directement via votre propre instance de Firebase Auth pour sécuriser vos données d'évaluation d'arène.
            </p>
          </div>

          {/* Toggle Tab header */}
          <div className="grid grid-cols-2 bg-brand-darkest p-1 rounded-xl border border-brand-border/40">
            <button
              onClick={() => { setAuthMode("signin"); setAuthError(""); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === "signin" ? "bg-brand-primary text-brand-darkest shadow-md" : "text-brand-muted hover:text-[#DAF1DE]"}`}
            >
              CONNEXION
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === "signup" ? "bg-brand-primary text-brand-darkest shadow-md" : "text-brand-muted hover:text-[#DAF1DE]"}`}
            >
              CRÉER COMPTE
            </button>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono leading-relaxed max-h-32 overflow-y-auto">
              {authError}
            </div>
          )}

          {/* Forms */}
          <form onSubmit={authMode === "signin" ? handleEmailSignIn : handleEmailSignUp} className="flex flex-col gap-4 font-sans text-xs">
            {authMode === "signup" && (
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-brand-primary" /> Pseudo du Joueur
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: RustaceanElite"
                  className="bg-[#051f20] border border-brand-border text-brand-primary focus:outline-none focus:border-brand-primary rounded-xl px-3.5 py-2.5 font-sans"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-brand-primary" /> Adresse Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: codeur@arena.com"
                className="bg-[#051f20] border border-brand-border text-brand-primary focus:outline-none focus:border-brand-primary rounded-xl px-3.5 py-2.5 font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5 relative text-left">
              <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-brand-primary" /> Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#051f20] border border-brand-border text-brand-primary focus:outline-none focus:border-brand-primary rounded-xl px-3.5 py-2.5 font-sans pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-brand-primary hover:bg-opacity-95 text-brand-darkest font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors shadow mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : authMode === "signin" ? (
                "Se Connecter"
              ) : (
                "Créer mon Compte"
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="flex items-center text-[10px] text-brand-muted font-mono uppercase tracking-widest gap-2">
            <span className="h-[1px] bg-brand-border/40 flex-1"></span>
            <span>Ou via OAuth</span>
            <span className="h-[1px] bg-brand-border/40 flex-1"></span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Real Google OAuth trigger */}
            <button
              onClick={() => handleSocialSignIn("google")}
              disabled={authLoading}
              className="bg-white hover:bg-neutral-100 text-black py-2.5 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
            >
              <img 
                src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=36&h=36&q=80" 
                alt="Google" 
                className="w-3.5 h-3.5 rounded-full"
              />
              <span>Google</span>
            </button>

            {/* Real GitHub OAuth trigger */}
            <button
              onClick={() => handleSocialSignIn("github")}
              disabled={authLoading}
              className="bg-[#18181b] hover:bg-[#202024] text-white border border-[#27272a] py-2.5 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              <img 
                src="https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=36&h=36&q=80" 
                alt="GitHub" 
                className="w-3.5 h-3.5 rounded-full"
              />
              <span>GitHub</span>
            </button>
          </div>

          {/* Collapsible integration tutorial */}
          <div className="mt-2 border-t border-brand-border/30 pt-4 text-left">
            <button
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-brand-primary p-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Prêter main forte à la configuration d'arène ?</span>
              </span>
              {showSetupGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            
            {showSetupGuide && (
              <div className="mt-3 p-3.5 bg-brand-darkest/70 border border-brand-border/50 rounded-xl flex flex-col gap-3 font-sans text-[10px] text-brand-muted leading-relaxed">
                <div>
                  <p className="font-bold text-[#DAF1DE] mb-1">1. Activer l'Email/Mot de passe :</p>
                  <p>Allez dans votre <strong>Console Firebase</strong> &gt; <strong>Authentication</strong> &gt; <strong>Sign-in method</strong> &gt; Activez <strong>Adresse e-mail/Mot de passe</strong> &gt; Enregistrer.</p>
                </div>
                <div>
                  <p className="font-bold text-[#DAF1DE] mb-1">2. Activer l'authentification GitHub :</p>
                  <p>Inscrivez une nouvelle application sur GitHub (Settings &gt; Developer settings &gt; OAuth Apps) et configurez l'URL d'autorisation fournie par la console Firebase, puis renseignez l'ID Client et le code secret sur Firebase.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Format Recharts data safely
  const recentScores = user.recentScores || [80, 85, 75];
  const chartData = recentScores.map((score: number, index: number) => ({
    name: `Soum. ${index + 1}`,
    score: score
  }));

  const achievements = [
    { title: "Maître du Pathfinding", description: "Atteindre une efficacité de 94% sur Neural Pathfinding.", icon: Award, unlocked: user.level >= 3 },
    { title: "Légende Temporelle", description: "Avoir résolu un défi dans la dernière minute du compte à rebours.", icon: Flame, unlocked: user.wins >= 5 },
    { title: "Diamant Poli", description: "Franchir le palier du rang Diamant III en arène de duels.", icon: Trophy, unlocked: user.wins >= 12 },
    { title: "Esprit Clairvoyant", description: "Soumettre 5 algorithmes d'affilée sans aucune erreur de syntaxe statique.", icon: CheckCircle, unlocked: user.level >= 5 }
  ];

  const levelPercent = Math.min(((user.totalScore % 500) / 500) * 100, 100);

  return (
    <div className="flex-grow overflow-y-auto p-8 select-none max-w-7xl mx-auto w-full font-sans">
      
      {/* Title block */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-[#DAF1DE] tracking-tight uppercase mb-2">Profil & Préférences</h2>
          <p className="text-sm font-medium text-brand-muted max-w-xl">
            Configurez votre espace d'arène d'élite, gérez vos variables de compilation et consultez votre progression synchronisée dans la BDD CodeArena.
          </p>
        </div>
        
        {/* Logout callback */}
        <button 
          onClick={async () => {
            try {
              await signOut(auth);
            } catch (err) {
              console.error(err);
            }
          }}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>Déconnexion</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 font-mono">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Bio details and progression */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        
        {/* User Stats Card (4 columns) */}
        <div className="col-span-12 lg:col-span-4 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col items-center text-center hover:border-brand-muted/70 transition-colors duration-300 premium-glow">
          <div className="w-24 h-24 rounded-full border-2 border-brand-primary p-1 relative mb-4">
            <div className="absolute inset-0 rounded-full border border-brand-primary animate-ping opacity-10"></div>
            {user.avatar ? (
              <img 
                alt="Votre Avatar" 
                className="w-full h-full object-cover rounded-full filter grayscale contrast-125 border border-zinc-800"
                src={user.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xl">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-brand-primary border border-brand-border rounded-full p-1 shadow-md">
              <Award className="w-4 h-4 text-brand-darkest fill-brand-darkest" />
            </div>
          </div>

          <h3 className="font-extrabold text-xl text-[#DAF1DE] tracking-tight">{user.username}</h3>
          <span className="text-xs font-bold text-brand-muted font-mono bg-brand-darkest px-3 py-1 rounded-full border border-brand-border/30 mt-1.5 uppercase tracking-wide">
            {user.provider === "github" ? "GitHub Elite" : "Ligue Google"}
          </span>

          <div className="w-full border-t border-brand-border/40 my-4 pt-4 flex flex-col gap-2.5 text-xs text-brand-muted text-left">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-muted" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-muted" />
              <span>Base centrale de CodeArena</span>
            </div>
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-brand-muted" />
              <span className="capitalize">Compte synchronisé via {user.provider}</span>
            </div>
          </div>

          {/* Level Progress meter */}
          <div className="w-full mt-2 text-left">
            <div className="flex justify-between items-center text-xs text-[#DAF1DE] font-bold mb-1.5 font-mono">
              <span>Niveau {user.level}</span>
              <span className="text-brand-muted">{user.totalScore % 500} / 500 XP</span>
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
              <span>Graphe de Variabilité de Score BDD</span>
            </h3>
            <span className="text-[10px] text-brand-muted font-mono uppercase tracking-wider font-bold">Base de Données V2</span>
          </div>

          {/* Recharts responsive layout */}
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-[220px]" style={{ width: "100%" }}>
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={chartData}>
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
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">
              Aucune évaluation de code sauvegardée pour l'instant. Soumettez un défi !
            </div>
          )}
        </div>
      </div>

      {/* Profile Settings and Preferences Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Form panel */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <h3 className="font-bold text-base text-[#DAF1DE] mb-5 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Éditer vos informations</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 font-sans">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Pseudo Arène</label>
              <input
                type="text"
                value={editingUsername}
                onChange={(e) => setEditingUsername(e.target.value)}
                className="w-full bg-[#09090b] border border-brand-border rounded-lg py-2.5 px-4 text-zinc-200 text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Thème Éditeur</label>
                <select
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value)}
                  className="w-full bg-[#09090b] border border-brand-border rounded-lg py-2.5 px-3 text-zinc-200 text-sm focus:outline-none focus:border-brand-primary cursor-pointer font-mono"
                >
                  <option value="vs-dark">VS Dark (Default)</option>
                  <option value="monokai">Monokai Retro</option>
                  <option value="hc-black">High Contrast Black</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Modèle IA</label>
                <select
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                  className="w-full bg-[#09090b] border border-brand-border rounded-lg py-2.5 px-3 text-zinc-200 text-sm focus:outline-none focus:border-brand-primary cursor-pointer font-mono"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Suggéré)</option>
                  <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o Agent</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs py-3 px-4 rounded-lg uppercase tracking-wider transition-colors duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
            >
              {updating ? "Enregistrement en cours..." : "Sauvegarder les Préférences"}
            </button>
          </form>
        </div>

        {/* Numerical Quick Counters & Safe Danger zone */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 text-center font-mono select-none">
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">DUELS GAGNÉS</p>
              <p className="text-3xl font-extrabold text-emerald-400">{user.wins || 0}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">DUELS PERDUS</p>
              <p className="text-3xl font-extrabold text-red-400">{user.losses || 0}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans font-sans">DÉFIS COMPLÉTÉS</p>
              <p className="text-3xl font-extrabold text-[#DAF1DE]">{user.challengesDone || 0}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-bold font-sans">EXPÉRENCE ACQUISE</p>
              <p className="text-3xl font-extrabold text-[#DAF1DE]">{user.totalScore || 0}</p>
            </div>
          </div>

          {/* Danger zone to delete account */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono mb-1">Zone de danger</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                La suppression de votre compte effacera de manière définitive toutes vos statistiques, préférences et historique d'évaluation de la base de données.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm("Voulez-vous vraiment supprimer définitivement votre compte CodeArena ?")) {
                  onDeleteMe();
                }
              }}
              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer compte</span>
            </button>
          </div>
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
