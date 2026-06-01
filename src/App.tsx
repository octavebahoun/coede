import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Terminal, 
  Sparkles, 
  Settings, 
  RefreshCw, 
  Cpu, 
  Award, 
  BookOpen, 
  HelpCircle,
  X,
  Code
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomeView from "./components/HomeView";
import EditorView from "./components/EditorView";
import ChallengesView from "./components/ChallengesView";
import ProfileView from "./components/ProfileView";
import DuelsView from "./components/DuelsView";
import LeaderboardView from "./components/LeaderboardView";
import LandingView from "./components/LandingView";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";


import { Challenge, Project, UserStats } from "./types";

export default function App() {
  const [currentTab, setTab] = useState<string>("landing");

  // Dynamic user session state (Phase V2 Database)
  const [user, setUser] = useState<any | null>(null);

  // Listen to Firebase Auth state on the client side and seamlessly synchronize the database user session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: firebaseUser.email,
              username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Invité",
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.email}`,
              provider: firebaseUser.providerData[0]?.providerId || "password"
            })
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          }
        } catch (err) {
          console.error("Erreur de synchronisation utilisateur", err);
        }
      } else {
        try {
          await fetch("/auth/logout", { method: "POST" });
        } catch (err) {
          console.warn("Erreur de déconnexion globale", err);
        }
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Redirection automatique des utilisateurs connectés et de la landing page sécurisée
  useEffect(() => {
    if (!user && currentTab !== "landing") {
      setTab("landing");
    } else if (user && currentTab === "landing") {
      setTab("home");
    }
  }, [user, currentTab]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/auth/me");
      if (response.ok) {
        const u = await response.json();
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("L'utilisateur n'est pas encore identifié en BDD", err);
      setUser(null);
    }
  };

  const handleLogin = async (provider: string, email: string, username: string, avatar: string) => {
    // Left as stub since onAuthStateChanged is the real source of truth now!
  };

  const handleLogout = async () => {
    // Left as stub since signOut(auth) is the real source of truth now!
  };

  const handleUpdateMe = async (updates: { username?: string; preferences?: any }) => {
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await loadUserProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMe = async () => {
    try {
      await fetch("/api/users/me", { method: "DELETE" });
      setUser(null);
      setTab("home");
    } catch (err) {
      console.error(err);
    }
  };

  // Virtual projects management
  const [recentProjects, setRecentProjects] = useState<Project[]>([
    {
      id: "neutron-gateway",
      name: "Neutron_Gateway",
      language: "Rust",
      description: "Système d'accès bas niveau asynchrone gérant la translation de ports réseau pour CodeArena.",
      modifiedAt: "Il y a 3 minutes",
      files: {
        "main.rs": `// Neutron Gateway - Routeur synaptique
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("0.0.0.0:3000").unwrap();
    println!("Moteur Neutron actif sur le port 3000.");
    for stream in listener.incoming() {
        println!("Connexion entrante etablie !");
    }
}
`,
        "Cargo.toml": `[package]
name = "neutron_gateway"
version = "1.0.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
`
      }
    },
    {
      id: "data-pipeline",
      name: "Data_Pipeline_V2",
      language: "Python",
      description: "Filtre d'extraction des métriques de CPU d'arène d'arrière-plan de CodeArena.",
      modifiedAt: "Il y a 10h",
      files: {
        "pipeline.py": `# Pipeline extracteur de metriques
import time
import random

def extract():
    print("Démarrage de l'analyse séquentielle...")
    while True:
        cpu = random.uniform(20.0, 95.0)
        print(f"[METRICS] CPU telemetry: {cpu:.1f}%")
        time.sleep(1.0)

if __name__ == "__main__":
    extract()
`
      }
    }
  ]);

  const [activeProject, setActiveProject] = useState<Project>(recentProjects[0]);

  // Derived userStats state with fallback block if not loaded
  const userStats = {
    level: user ? user.level : 1,
    totalScore: user ? user.totalScore : 0,
    challengesDone: user ? user.challengesDone : 0,
    wins: user ? user.wins : 0,
    losses: user ? user.losses : 0,
    recentScores: user ? user.recentScores : [],
    proPassUnlocked: user ? user.proPassUnlocked : false
  };

  const handleActivateProPass = async () => {
    if (user) {
      await handleUpdateMe({
        preferences: user.preferences,
        username: user.username,
        // Set proPassUnlocked as part of database
      });
      // also set it directly
      try {
        await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proPassUnlocked: true })
        });
        await loadUserProfile();
      } catch (err) {
        console.error(err);
      }
    }
    setShowPremiumModal(false);
  };

  // Modal dialog states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLang, setNewProjectLang] = useState<"Rust" | "Python" | "React" | "C++">("Rust");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Quick-launcher project load
  const handleStartProject = (project: Project) => {
    setActiveProject(project);
    setTab("editor");
  };

  // Create workspace canvas actions
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const baseFiles: Record<string, string> = {};
    if (newProjectLang === "Rust") {
      baseFiles["main.rs"] = `fn main() {\n    println!("Bonjour, nouveau projet ${newProjectName} !");\n}`;
    } else if (newProjectLang === "Python") {
      baseFiles["main.py"] = `def main():\n    print("Nouveau projet ${newProjectName}")\n\nif __name__ == "__main__":\n    main()`;
    } else if (newProjectLang === "React") {
      baseFiles["App.tsx"] = `import React from 'react';\n\nexport default function App() {\n  return <h3>Composant ${newProjectName} actif !</h3>;\n}`;
      baseFiles["index.html"] = `<!DOCTYPE html>\n<html>\n<body>\n  <div id="root"></div>\n</body>\n</html>`;
    } else {
      baseFiles["main.js"] = `console.log("Projet JavaScript ${newProjectName} initialisé.");`;
    }

    const newProj: Project = {
      id: "proj-" + Date.now(),
      name: newProjectName.trim().replace(/\s+/g, "_"),
      language: newProjectLang,
      description: newProjectDesc.trim() || "Aucune description fournie.",
      modifiedAt: "À l'instant",
      files: baseFiles
    };

    setRecentProjects([newProj, ...recentProjects]);
    setActiveProject(newProj);
    setNewProjectName("");
    setNewProjectDesc("");
    setShowNewProjectModal(false);
    setTab("editor");
  };

  // Code evaluator feedback modifiers
  const handleChallengeEvaluated = (score: number) => {
    // Reload user profile from server to reflect automatically processed DB record
    loadUserProfile();
  };

  // Duel matchmaking winning counters
  const handleDuelWinner = async () => {
    if (user) {
      const addedScore = 45;
      const newTotal = user.totalScore + addedScore;
      const newLevel = Math.floor(newTotal / 500) + 1;
      try {
        await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            preferences: user.preferences,
            proPassUnlocked: user.proPassUnlocked
          })
        });
        // We'll update duels outcomes natively on Express in actual V2 if needed, 
        // let's triggers direct database update route:
        user.wins += 1;
        user.totalScore += 45;
        user.level = Math.floor(user.totalScore / 500) + 1;
        user.recentScores.push(95);
        
        await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        });
        await loadUserProfile();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDuelLoser = async () => {
    if (user) {
      try {
        user.losses += 1;
        user.totalScore += 10;
        user.level = Math.floor(user.totalScore / 500) + 1;
        user.recentScores.push(65);
        
        await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        });
        await loadUserProfile();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const syncEditedProjectFiles = (updatedFiles: Record<string, string>) => {
    setRecentProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, files: updatedFiles, modifiedAt: "À l'instant" };
      }
      return p;
    }));
    setActiveProject(prev => ({ ...prev, files: updatedFiles, modifiedAt: "À l'instant" }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-darkest select-none">
      
      {/* Lateral navigation menu - visible uniquement si connecté */}
      {user && (
        <Sidebar 
          currentTab={currentTab} 
          setTab={setTab} 
          onNewProject={() => setShowNewProjectModal(true)} 
          user={user}
          onAuthClick={() => setTab("profile")}
        />
      )}

      {/* Main frame workspace layout */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {user && (
          <Header 
            onGoProClick={() => setShowPremiumModal(true)} 
            openSettings={() => setShowSettingsModal(true)}
            proPassUnlocked={userStats.proPassUnlocked}
          />
        )}

        {/* Dynamic content renders inside interactive animate presences */}
        <div className="flex-grow min-h-0 relative flex flex-col">
          <AnimatePresence mode="wait">
            {currentTab === "landing" && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <LandingView 
                  onEnterArena={(tab) => setTab(tab)}
                  user={user}
                  onAuthClick={() => {
                    setTab("profile");
                  }}
                />
              </motion.div>
            )}

            {currentTab === "home" && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <HomeView 
                  recentProjects={recentProjects} 
                  onNewProject={() => setShowNewProjectModal(true)}
                  onStartProject={handleStartProject}
                />
              </motion.div>
            )}

            {currentTab === "editor" && (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <EditorView 
                  activeProject={activeProject}
                  onSaveFiles={syncEditedProjectFiles}
                />
              </motion.div>
            )}

            {currentTab === "challenges" && (
              <motion.div 
                key="challenges"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ChallengesView 
                  onCodeEvaluated={handleChallengeEvaluated}
                  onStartChallenge={() => {}}
                  proPassUnlocked={userStats.proPassUnlocked}
                  onGoProClick={() => setShowPremiumModal(true)}
                />
              </motion.div>
            )}

            {currentTab === "profile" && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ProfileView 
                  user={user}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onUpdateMe={handleUpdateMe}
                  onDeleteMe={handleDeleteMe}
                />
              </motion.div>
            )}

            {currentTab === "leaderboard" && (
              <motion.div 
                key="leaderboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <LeaderboardView currentUserEmail={user?.email} />
              </motion.div>
            )}

            {currentTab === "duels" && (
              <motion.div 
                key="duels"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <DuelsView user={user} onDuelWin={handleDuelWinner} onDuelLoss={handleDuelLoser} />
              </motion.div>
            )}

            {/* Support Tab layout block informational */}
            {currentTab === "support" && (
              <motion.div 
                key="support"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full font-sans select-none flex flex-col gap-6"
              >
                <h2 className="text-3xl font-extrabold text-brand-primary uppercase">Support Module</h2>
                <p className="text-xs text-brand-muted font-medium">Obtenez de l'aide et soumettez vos questions concernant l'arène CodeArena.</p>
                <div className="bg-brand-surface border border-brand-border p-6 rounded-xl flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-brand-primary">Centre de ticket intelligent CodeArena Alpha</h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Si vous rencontrez des problèmes de compilateur ou d'accès d'arène, notre équipe de modération technique et nos tuteurs seniors sont toujours prêts à vous dépanner sous 2h ouvrées.
                  </p>
                  <button className="bg-brand-primary text-brand-darkest text-xs font-bold py-2.5 px-4 rounded-xl w-fit cursor-pointer">
                    Contacter l'Assistance
                  </button>
                </div>
              </motion.div>
            )}

            {/* Documentation Tab layout block informational */}
            {currentTab === "docs" && (
              <motion.div 
                key="docs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full font-sans select-none flex flex-col gap-6"
              >
                <h2 className="text-3xl font-extrabold text-brand-primary uppercase">Documentation Technique</h2>
                <p className="text-xs text-brand-muted font-medium">Découvrez les secrets de l'architecture d'arène CodeArena.</p>
                <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-brand-primary flex items-center gap-2"><BookOpen className="w-4 h-4" /> Manuel du Participant</h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Toutes nos sessions d'arène de duel chronométré respectent les spécifications de rapidité. Le scoring est calculé de manière objective par des modèles LLMs basés sur la performance VRAM allouée, la modularité algorithmique, et le respect strict du cahier des charges fourni.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NEW PROJECT CREATION POPUP MODAL DIALOG */}
      {showNewProjectModal && (
        <div className="absolute inset-0 bg-[#051f20]/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b2b26] border border-[#235347] rounded-2xl p-8 max-w-md w-full shadow-2xl font-sans"
          >
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3 mb-5">
              <h3 className="font-extrabold text-brand-primary text-base flex items-center gap-2">
                <Code className="w-5 h-5 text-brand-primary" /> Créer un Projet Vierge
              </h3>
              <button 
                onClick={() => setShowNewProjectModal(false)}
                className="text-brand-muted hover:text-brand-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Nom du Projet</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex : monolith_routeur"
                  className="bg-[#051f20] border border-brand-border text-brand-primary focus:outline-none focus:border-brand-primary rounded-xl px-3.5 py-2.5 text-xs font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Langage de base</label>
                <select
                  value={newProjectLang}
                  onChange={(e: any) => setNewProjectLang(e.target.value)}
                  className="bg-[#051f20] border border-brand-border rounded-xl text-brand-primary text-xs p-2.5 focus:border-brand-primary font-semibold cursor-pointer"
                >
                  <option value="Rust">Rust (cargo binary)</option>
                  <option value="Python">Python (main execution file)</option>
                  <option value="React">React JSX HTML layout</option>
                  <option value="C++">C++ Standard library</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Ex : Module centralisé de traitement de paquets..."
                  className="bg-[#051f20] border border-brand-border text-brand-primary focus:outline-none focus:border-brand-primary rounded-xl px-3.5 py-2.5 text-xs resize-none h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary text-brand-darkest hover:bg-opacity-90 py-3 rounded-xl font-bold text-xs tracking-wider uppercase mt-3 transition-colors shadow select-none cursor-pointer"
              >
                Démarrer Projet
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* PREMIUM UPGRADE MARKETING MODAL */}
      {showPremiumModal && (
        <div className="absolute inset-0 bg-[#051f20]/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b2b26] border border-brand-primary rounded-2xl p-8 max-w-sm w-full shadow-2xl font-sans text-center premium-glow relative"
          >
            <button 
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-primary cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <Award className="w-14 h-14 text-brand-primary fill-brand-primary mx-auto mb-4 animate-bounce" />
            <h4 className="font-sans font-black text-[#DAF1DE] uppercase text-lg mb-1 leading-none">Rejoignez le Pass Pro d'Élite !</h4>
            <p className="text-xs text-brand-muted mb-6 font-semibold select-none">Débloquez les duels 2v2 & l'assistant compilateur IA de pointe</p>
            
            <div className="bg-[#051f20] border border-brand-border rounded-xl p-4 mb-6 leading-relaxed text-left text-xs text-brand-muted flex flex-col gap-2">
              <p className="font-bold text-brand-primary flex items-center gap-1.5">★ Fonctionnalités clés :</p>
              <p>• Générateur de défi par invites personnalisées illimité.</p>
              <p>• Accompagnement tutoriel vocal IA interactif en temps réel.</p>
              <p>• Intégration de pipelines de déploiement Cloud Run directs.</p>
            </div>

            <button
              onClick={handleActivateProPass}
              className="w-full bg-brand-primary text-brand-darkest hover:bg-opacity-95 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow cursor-pointer"
            >
              S'abonner - Activer
            </button>
          </motion.div>
        </div>
      )}

      {/* GLOBAL SETTINGS CONFIGURATION MODAL */}
      {showSettingsModal && (
        <div className="absolute inset-0 bg-[#051f20]/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b2b26] border border-brand-border rounded-2xl p-8 max-w-md w-full shadow-2xl font-sans"
          >
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3 mb-5">
              <h3 className="font-extrabold text-brand-primary text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-primary" /> Configuration Arène & Compilateurs
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-brand-muted hover:text-brand-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 leading-normal text-xs text-brand-muted">
              <div className="flex justify-between items-center">
                <span className="font-bold text-brand-primary">Mode de compilation</span>
                <span className="bg-brand-active px-2.5 py-1 rounded text-brand-primary font-mono font-bold border border-brand-border">Intégral standard</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-brand-primary">Thème de l'Éditeur</span>
                <span className="bg-brand-active px-2.5 py-1 rounded text-brand-primary font-mono font-bold border border-brand-border">Emerald Tech Oscuro</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-brand-primary">Vitesse de transmission locale</span>
                <span className="text-[#DAF1DE] font-semibold font-mono">0.05ms (SLA excellent)</span>
              </div>
              <div className="flex justify-between items-center border-t border-brand-border/20 pt-4 mt-2">
                <span className="font-bold text-brand-primary">Clé API intégrée</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Configurée via secrets
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full bg-brand-primary text-brand-darkest hover:bg-opacity-95 py-3 rounded-xl font-bold text-xs uppercase tracking-wider mt-6 transition-colors shadow cursor-pointer text-center"
            >
              Fermer Configuration
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
