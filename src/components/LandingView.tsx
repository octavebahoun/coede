import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Cpu, 
  Trophy, 
  Radio, 
  Terminal, 
  Zap, 
  ChevronRight, 
  Database, 
  Compass, 
  Play, 
  FileCode, 
  Settings, 
  ShieldCheck, 
  RefreshCw,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  X,
  ShieldAlert,
  LogIn
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";

interface LandingViewProps {
  onEnterArena: (tab: string) => void;
  user: any;
  onAuthClick: () => void;
}

export default function LandingView({ onEnterArena, user, onAuthClick }: LandingViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive console preview state
  const [activeFile, setActiveFile] = useState<"rust" | "python" | "react">("rust");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string[]>([]);
  const [activePlanet, setActivePlanet] = useState<number | null>(null);

  // Authentication Modal Internal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error(err);
      setAuthError("Email ou mot de passe incorrect.");
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
      setShowAuthModal(false);
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
      setShowAuthModal(false);
    } catch (err: any) {
      console.error(err);
      setAuthError(
        `Connexion via ${providerName === "google" ? "Google" : "GitHub"} impossible. Vérifiez l'activation dans Firebase.`
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Files data
  const files = {
    rust: {
      name: "Navigation_Orbite.rs",
      lang: "Rust",
      code: `// CodeArena Quantum Router - Navigation
use std::sync::Arc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let engine_core = Arc::new(SupernovaCore::init().await);
    println!("🌌 Hyperpropulsion synchronisée sur l'orbite 4-A.");
    
    loop {
        let telemetry = engine_core.get_stellar_flux().await;
        if telemetry.efficiency > 0.98 {
            println!("🚀 Vitesse de croisière optimale : {} Mach", telemetry.speed);
        }
        sleep(Duration::from_millis(500)).await;
    }
}`
    },
    python: {
      name: "Calculateur_Nebuleuse.py",
      lang: "Python",
      code: `# CodeArena Quantum Router - Nebular Telemetry
import time
import random

class NebularProcessor:
    def __init__(self, flux_index: float):
        self.flux_index = flux_index
        print("⚡ Module py-nebula connecté au grid cosmique.")

    def run_stellar_mesh(self):
        while True:
            entropy = random.uniform(0.01, 0.05)
            self.flux_index += 1.2 * entropy
            print(f"[COSMIC_TEL] Flux: {self.flux_index:.4f} MeV | Entropy: {entropy:.2%}")
            time.sleep(0.8)

if __name__ == "__main__":
    NebularProcessor(1504.85).run_stellar_mesh()`
    },
    react: {
      name: "Tableau_Bord.tsx",
      lang: "TypeScript",
      code: `// CodeArena Cockpit UI Standard
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

export function StellarMonitor() {
  const [flux, setFlux] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlux(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 border border-emerald-500/30 rounded-xl">
      <h3 className="text-emerald-400 font-mono">STABILITY MESH: {flux}%</h3>
    </div>
  );
}`
    }
  };

  // Cosmic Stars interactive backgrounds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Stars definition
    const numStars = 110;
    const stars: { x: number; y: number; size: number; speed: number; alpha: number; dAlpha: number }[] = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.15 + 0.04,
        alpha: Math.random(),
        dAlpha: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    // Shooting stars definition
    const shootingStars: { x: number; y: number; len: number; speed: number; angle: number; active: boolean }[] = [];
    const spawnShootingStar = () => {
      if (Math.random() < 0.05 && shootingStars.length < 3) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          len: Math.random() * 80 + 30,
          speed: Math.random() * 6 + 4,
          angle: Math.PI / 6 + Math.random() * (Math.PI / 12),
          active: true
        });
      }
    };

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep celestial ambient background colors
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width);
      gradient.addColorStop(0, "#011211");
      gradient.addColorStop(0.5, "#040d0c");
      gradient.addColorStop(1, "#09090b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Distant nebulous color glow blobs
      ctx.beginPath();
      const radGrad = ctx.createRadialGradient(width * 0.25, height * 0.35, 50, width * 0.25, height * 0.35, 450);
      radGrad.addColorStop(0, "rgba(16, 185, 129, 0.08)");
      radGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.03)");
      radGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radGrad;
      ctx.arc(width * 0.25, height * 0.35, 450, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      const radGrad2 = ctx.createRadialGradient(width * 0.75, height * 0.65, 50, width * 0.75, height * 0.65, 550);
      radGrad2.addColorStop(0, "rgba(124, 58, 237, 0.07)");
      radGrad2.addColorStop(0.5, "rgba(139, 92, 246, 0.02)");
      radGrad2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radGrad2;
      ctx.arc(width * 0.75, height * 0.65, 550, 0, Math.PI * 2);
      ctx.fill();

      // Render drifting stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        
        // Slowly drift stars towards left/down to give feel of orbit travel
        s.x -= s.speed;
        if (s.x < 0) s.x = width;
        
        // Twin-glow flicker
        s.alpha += s.dAlpha;
        if (s.alpha <= 0.1 || s.alpha >= 1) {
          s.dAlpha = -s.dAlpha;
        }

        // Draw individual star
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218, 241, 222, ${Math.max(0.2, s.alpha * 0.85)})`;
        ctx.fill();

        // Mouse gravity reaction (slight drag/shimmer towards mouse)
        const dx = mouseX - s.x;
        const dy = mouseY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(0.4, s.alpha * 0.9)})`;
          ctx.fill();
        }
      }

      // Render cascading shooting stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) continue;

        const endX = ss.x + Math.cos(ss.angle) * ss.len;
        const endY = ss.y + Math.sin(ss.angle) * ss.len;

        // Custom linear gradient for tail fadeout
        const ssGrad = ctx.createLinearGradient(ss.x, ss.y, endX, endY);
        ssGrad.addColorStop(0, "rgba(16, 185, 129, 0.95)");
        ssGrad.addColorStop(0.3, "rgba(250, 250, 250, 0.8)");
        ssGrad.addColorStop(1, "rgba(250, 250, 250, 0)");

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = ssGrad;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Move shooting star
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        // Deactivate if out of boundaries
        if (ss.y > height || ss.x > width) {
          ss.active = false;
          shootingStars.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Diagnostic scanner simulation
  const triggerCodeScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStatus([]);
    
    const messages = [
      "📡 Handshake initialisé avec la grille quantique CodeArena ... OK",
      `🕵️‍♂️ Analyse syntaxique de ${files[activeFile].name} en cours ...`,
      "🧠 Module d'analyse sémantique Gemini activé (3.5-flash)",
      "🤖 Vérification du respect des critères d'optimalité O(n log n) ...",
      "✅ Diagnostics : AUCUNE brèche détectée ! Modularité : 98%",
      "💎 Score d'efficacité stellaire calculé : 95/100"
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setScanStatus(prev => [...prev, messages[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 800);
      }
    }, 400);
  };

  // Celestial planets information
  const celestialPlanets = [
    {
      name: "Duels Stellaires (PvP)",
      desc: "Affrontez des développeurs d'élite lors d'arènes d'évaluation asynchrones minutées en temps réel synchronisées sur Firebase.",
      icon: Zap,
      color: "from-amber-400 to-orange-500",
      accent: "#f59e0b",
      orbitRadius: 180,
      orbitSpeed: 0.015,
      scale: 1,
      tag: "Arène"
    },
    {
      name: "Coach IA Gemini",
      desc: "Profitez de l'intelligence Gemini intégrée qui évalue l'architecture, la complexité calculatoire et vous conseille verbalement.",
      icon: Sparkles,
      color: "from-emerald-400 to-teal-500",
      accent: "#10b981",
      orbitRadius: 280,
      orbitSpeed: 0.009,
      scale: 1,
      tag: "Compilateur LLM"
    },
    {
      name: "Bac à Sable IDE",
      desc: "Un environnement de développement instantané polyglotte supportant Rust, Python, React et C++ avec gestion d'état locale.",
      icon: Terminal,
      color: "from-blue-400 to-indigo-500",
      accent: "#3b82f6",
      orbitRadius: 380,
      orbitSpeed: 0.006,
      scale: 1,
      tag: "Workspace"
    }
  ];

  return (
    <div ref={containerRef} className="flex-grow overflow-y-auto relative w-full h-full font-sans select-none bg-brand-darkest">
      
      {/* Dynamic reactive canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-20">
        
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 pt-4">
          
          {/* Left Hero elements */}
          <div className="flex-1 flex flex-col gap-6 text-left max-w-2xl">
            {/* Elegant tiny badge */}
            <div className="inline-flex items-center gap-2 bg-[#02251a] border border-[#14533e]/50 py-1.5 px-3.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#a7f3d0] uppercase">
                Bienvenue dans l'Odyssée Cosmique V2
              </span>
            </div>

            {/* Display title with pairing */}
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#DAF1DE] leading-[1.1] tracking-tight">
                Triomphez dans l'Infini de <br />
                <span className="font-serif italic font-light text-brand-primary tracking-normal block mt-1">
                  la Programmation Stellaires
                </span>
              </h1>
              <p className="text-xs md:text-sm text-brand-muted leading-relaxed font-sans max-w-lg mt-2">
                CodeArena réinvente le colisée d'évaluation d'algorithmes. Affrontez les astres, perfectionnez vos compétences quantiques assisté par l'IA Gemini, et gravez votre nom sur le leaderboard céleste de la ligue de production.
              </p>
            </div>

            {/* Action buttons triggers */}
            <div className="flex flex-wrap gap-4 mt-2">
              <button
                onClick={() => {
                  if (user) onEnterArena("challenges");
                  else setShowAuthModal(true);
                }}
                className="bg-[#10b981] hover:bg-[#34d399] text-[#09090b] text-xs font-bold font-sans py-3 px-6 rounded-xl flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer hover:scale-[1.03] uppercase tracking-wider font-semibold active:scale-[0.98]"
              >
                <span>S'engager dans l'Arène</span>
                <ChevronRight className="w-4 h-4 text-[#09090b]" />
              </button>

              <button
                onClick={() => {
                  if (user) onEnterArena("editor");
                  else setShowAuthModal(true);
                }}
                className="bg-[#121214] hover:bg-[#1c1c1f] text-[#DAF1DE] border border-brand-border text-xs font-mono font-bold py-3 px-6 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Terminal className="w-4 h-4 text-brand-accent-light" />
                <span>Ouvrir l'IDE Vierge</span>
              </button>

              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-[#0b132b]/80 hover:bg-[#0f1b3d] text-brand-accent-light border border-[#1b3a6b]/30 text-xs font-sans py-3 px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>S'authentifier en Direct</span>
                </button>
              )}
            </div>

            {/* User credentials greeting bar if logged in */}
            {user && (
              <div className="p-4 bg-[#121214]/60 border border-brand-border rounded-xl flex items-center gap-4 max-w-md">
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-10 h-10 rounded-full border border-[#10b981]/40"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left font-sans">
                  <p className="text-xs font-bold text-[#DAF1DE]">Officier {user.username} identifié !</p>
                  <p className="text-[10px] text-[#10b981] font-mono uppercase font-black">Niveau de synchronisation : {user.level} (Premium Pass)</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Hero Space cockpit panel with live scan preview */}
          <div className="flex-grow lg:max-w-xl w-full flex flex-col bg-[#121214]/85 border border-[#27272a] rounded-2xl hover:border-zinc-700 transition-all duration-300 overflow-hidden shadow-2xl premium-glow">
            
            {/* Spaceship Console Header Bar */}
            <div className="h-11 bg-[#09090b] border-b border-[#27272a] flex items-center justify-between px-4 select-none">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <span className="font-mono text-[9px] text-[#10b981] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#02251a] px-2.5 py-0.5 rounded border border-[#10b981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>COMPILATEUR STELLAIRE v24</span>
              </span>
              <button 
                onClick={triggerCodeScan}
                disabled={isScanning}
                className="text-zinc-500 hover:text-[#10b981] active:scale-[0.98] transition-colors cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-[#10b981]" : ""}`} />
              </button>
            </div>

            {/* Simulated file tabs selection (tabs selector) */}
            <div className="grid grid-cols-3 bg-[#09090b]/40 border-b border-[#27272a]/70 p-1 font-mono text-[10px]">
              {(["rust", "python", "react"] as const).map((key) => {
                const isCurrent = activeFile === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveFile(key); setScanStatus([]); }}
                    className={`py-2 px-1 rounded transition-colors font-semibold uppercase tracking-wider cursor-pointer ${
                      isCurrent 
                        ? "bg-[#121214] text-[#10b981] border border-brand-border" 
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {files[key].name}
                  </button>
                );
              })}
            </div>

            {/* Console Screen and code representation */}
            <div className="p-4 flex-grow min-h-[200px] flex flex-col justify-between font-mono bg-[#09090b]/20 relative">
              {/* Overlay scan scanning glowing bar */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#10b981]/70 to-transparent top-0 animate-[bounce_1.5s_infinite] shadow-[0_0_12px_#10b981] pointer-events-none" />
              )}
              
              <div className="flex-1 overflow-x-auto text-[10.5px] leading-relaxed text-zinc-300 scrollbar-thin overflow-y-auto max-h-56">
                <pre className="text-left font-mono">
                  <code>{files[activeFile].code}</code>
                </pre>
              </div>

              {/* Collapsed scanned outcome diagnostic block */}
              {scanStatus.length > 0 && (
                <div className="mt-4 border-t border-brand-border/40 pt-4 text-left flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  <p className="text-[9px] text-[#10b981] font-bold uppercase tracking-wider">Compte-rendu de télémesures cosmologiques :</p>
                  {scanStatus.map((msg, idx) => {
                    let textClass = "text-zinc-400";
                    if (msg.includes("OK") || msg.includes("✅")) textClass = "text-[#34d399] font-bold";
                    if (msg.includes("Score")) textClass = "text-emerald-300 font-extrabold border-l border-[#10b981] pl-2";
                    return (
                      <p key={idx} className={`text-[10px] ${textClass}`}>
                        {msg}
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Simulated Diagnostic footer button trigger */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#27272a]/40 text-[10px]">
                <span className="text-zinc-500 font-sans tracking-wide">Language : {files[activeFile].lang}</span>
                <button
                  onClick={triggerCodeScan}
                  disabled={isScanning}
                  className="bg-[#02251a] hover:bg-[#063f2e] text-[#10b981] border border-[#14533e] px-3.5 py-1.5 rounded-lg active:scale-[0.98] transition-all cursor-pointer font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Analyser le Code</span>
                </button>
              </div>
            </div>
            
          </div>

        </section>

        {/* INTERACTIVE CELESTIAL ORBIT OVERVIEW */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
            <h2 className="text-xs uppercase tracking-widest text-[#10b981] font-mono font-black">Planétarium Sémantique de l'arène</h2>
            <h3 className="text-2xl font-bold text-[#DAF1DE] font-sans">
              Explorez le Cosmos Fonctionnel
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Survolez les corps stellaires en gravitation orbitale ci-dessous pour appréhender les modules de télémesures et de duels de l'architecture.
            </p>
          </div>

          {/* Interactive Celestial sphere orbit card */}
          <div className="bg-[#121214]/60 border border-brand-border rounded-2xl p-6 md:p-10 relative flex flex-col lg:flex-row gap-12 items-center justify-between overflow-hidden shadow-xl premium-glow">
            
            {/* Orbital dynamic diagram canvas mapping (Left Column) */}
            <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] shrink-0 flex items-center justify-center z-10">
              
              {/* Floating Star center core represented by Supernova */}
              <div className="absolute w-12 h-12 rounded-full bg-[#10b981] shadow-[0_0_35px_rgba(16,185,129,0.8)] border border-[#34d399] flex items-center justify-center z-20 animate-pulse">
                <Compass className="w-5 h-5 text-brand-darkest font-bold animate-[spin_10s_linear_infinite]" />
              </div>

              {/* Celestial Language ring rings orbiting standard mapping */}
              {celestialPlanets.map((p, idx) => {
                const diameter = p.orbitRadius;
                const isHovered = activePlanet === idx;
                
                return (
                  <React.Fragment key={idx}>
                    {/* Orbit lines */}
                    <div 
                      style={{ 
                        width: `${diameter}px`, 
                        height: `${diameter}px`, 
                      }}
                      className={`absolute rounded-full border border-dashed transition-colors duration-300 pointer-events-none z-0 ${
                        isHovered ? "border-[#10b981]/50 bg-[#10b981]/[0.015]" : "border-brand-border/40"
                      }`}
                    />

                    {/* Orbit planetary nodes with static rotation positioning */}
                    <div 
                      style={{ 
                        width: `${diameter}px`, 
                        height: `${diameter}px`,
                        transform: `rotate(${45 + idx * 120}deg)` 
                      }}
                      className="absolute z-10 pointer-events-none"
                    >
                      {/* Planetary sphere body */}
                      <div 
                        onMouseEnter={() => setActivePlanet(idx)}
                        onMouseLeave={() => setActivePlanet(null)}
                        style={{ 
                          transform: `translate(-50%, -50%) rotate(-${45 + idx * 120}deg)`,
                          top: "0px",
                          left: "50%"
                        }}
                        className={`absolute pointer-events-auto cursor-pointer p-2.5 rounded-full border bg-[#09090b] shadow-lg transition-all hover:scale-[1.12] duration-200 z-20 ${
                          isHovered ? "border-[#10b981] shadow-[0_0_15px_#10b981]" : "border-brand-border"
                        }`}
                      >
                        <p.icon className={`w-4 h-4`} style={{ color: p.accent }} />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Static Information details panel about current selected stellar body (Right Column) */}
            <div className="flex-1 flex flex-col gap-6 text-left w-full h-full justify-center">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase bg-[#18181b] text-zinc-500 font-bold border border-brand-border py-1 px-3.5 rounded-lg w-fit">
                  Corps Stellaires Actif
                </span>
                <h4 className="text-xl font-bold text-[#DAF1DE]">
                  {activePlanet !== null ? celestialPlanets[activePlanet].name : "Survolez une planète en orbite"}
                </h4>
                <p className="text-xs text-brand-muted leading-relaxed max-w-xl">
                  {activePlanet !== null ? celestialPlanets[activePlanet].desc : "Chaque planète ci-contre gravite autour du processeur principal de CodeArena. Passez votre curseur au-dessus pour activer les diagnostics détaillés et comprendre leurs spécificités physiques."}
                </p>
              </div>

              {/* Tiny details box */}
              {activePlanet !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-[#09090b] border border-brand-border rounded-xl font-mono text-[10px] flex flex-col gap-1 text-[#10b981]"
                >
                  <p>🪐 MODULE : {celestialPlanets[activePlanet].tag}</p>
                  <p>🌀 CHAMP D'ATTRACTION : Réseau de neurones optimal</p>
                  <p>📡 CAPACITÉ CONSTATE : OPÉRATIONNEL À 100% (Green Grid)</p>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-4 border-t border-brand-border/40 pt-6">
                <div>
                  <p className="text-lg font-black text-[#DAF1DE] font-mono">350+</p>
                  <p className="text-[10px] text-brand-muted font-bold tracking-wider uppercase font-sans mt-0.5">Défis Résolus</p>
                </div>
                <div>
                  <p className="text-lg font-black text-[#DAF1DE] font-mono">1.2ms</p>
                  <p className="text-[10px] text-brand-muted font-bold tracking-wider uppercase font-sans mt-0.5">SLA de compilation</p>
                </div>
                <div>
                  <p className="text-lg font-black text-[#10b981] font-mono">12 </p>
                  <p className="text-[10px] text-brand-muted font-bold tracking-wider uppercase font-sans mt-0.5">Ligues Actives</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FEATURES BENTO GRID */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5 text-left border-l-4 border-[#10b981] pl-4">
            <h3 className="text-xs uppercase tracking-widest text-[#10b981] font-mono font-extrabold">Qualité Militaire Alpha</h3>
            <h2 className="text-2xl font-serif italic text-[#DAF1DE] tracking-tight">Caractéristiques Fondamentales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
            
            {/* Bento 1: Dynamic Telemetry compiler */}
            <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-[#27272a] duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#02251a] border border-[#14533e] flex items-center justify-center text-[#10b981] mb-5">
                  <Cpu className="w-5 h-5 text-brand-accent-light" />
                </div>
                <h4 className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2">Compilateur IA Synaptique</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Grâce à Gemini, nos routines de correction LLM valident votre code, calculent son efficacité par rapport aux standards de complexes algorithmiques, et décrivent les optimisations possibles.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider mt-5">Intégration Standard</span>
            </div>

            {/* Bento 2: Fast Duels matchmaking */}
            <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-[#27272a] duration-300 col-span-1">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#02251a] border border-[#14533e] flex items-center justify-center text-[#10b981] mb-5">
                  <Zap className="w-5 h-5 text-brand-accent-light" />
                </div>
                <h4 className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2">Matchmaking Relais</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Créez des salons de duels d'arène en un clic. Votre code est opposé à un autre colocataire de code en direct, synchronisé de manière atomique sur votre instance.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider mt-5">Synchronisation Atomique</span>
            </div>

            {/* Bento 3: Sovereign Real Storage */}
            <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-[#27272a] duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#02251a] border border-[#14533e] flex items-center justify-center text-[#10b981] mb-5">
                  <Database className="w-5 h-5 text-brand-accent-light" />
                </div>
                <h4 className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2">Persistance Firebase</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Toutes vos statistiques (historiques de duels victorieux, niveau de passe pro, logs de performances quantiques de codage) sont durablement sécurisées et conservées via Firestore.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider mt-5">Base Cloud Distribuée</span>
            </div>

            {/* Bento 4: Code sandbox polyglotte */}
            <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-[#27272a] duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#02251a] border border-[#14533e] flex items-center justify-center text-[#10b981] mb-5">
                  <Terminal className="w-5 h-5 text-brand-accent-light" />
                </div>
                <h4 className="text-brand-primary text-sm font-bold uppercase tracking-wider mb-2">Environnement Polyglotte</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Bénéficiez d'un éditeur de code virtuel avec fichiers modifiables, sauvegarde de brouillon locale et exécution simulée de terminaux Unix, optimisé pour les développeurs.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider mt-5">Système de fichiers Virtuels</span>
            </div>

          </div>
        </section>

        {/* EXEMPLES DE FEINET / FEATURED MISSIONS GALLERY */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5 text-left border-l-4 border-[#10b981] pl-4">
            <h3 className="text-xs uppercase tracking-widest text-[#10b981] font-mono font-extrabold">Exemples de Missions actives</h3>
            <h2 className="text-2xl font-serif italic text-[#DAF1DE] tracking-tight">Simulations de Télémesures de l'Arène</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            {[
              {
                id: "neuro",
                title: "Neural Pathfinding 3D",
                difficulty: "Extrême",
                lang: "Python • TensorFlow",
                desc: "Optimisez un agent d'apprentissage par renforcement pour s'échapper d'un réseau dynamique d'obstacles tridimensionnels en minimisant les collisions.",
                metric: "Vélocité: 94%"
              },
              {
                id: "context",
                title: "Token Context Expansion",
                difficulty: "Hard",
                lang: "Rust • Sparse Attention",
                desc: "Implémentez un mécanisme d'attention clairséme de type Local Attention pour gérer une fenêtre contextuelle de 1M de tokens sous cache.",
                metric: "Taux réussite: 22%"
              },
              {
                id: "quantum",
                title: "Quantum Error Correction",
                difficulty: "Medium",
                lang: "Python • Qiskit",
                desc: "Concevez un circuit de correction d'erreurs en appliquant des codes stabilisateurs de phase ZZZZ pour préserver l'intégrité de qubits logiques.",
                metric: "Fidélité logique: 99.9%"
              }
            ].map((ch) => (
              <div 
                key={ch.id} 
                className="bg-[#121214]/80 border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Lock overlay banner */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#1c0c0d]/80 border border-red-500/20 px-2.5 py-1 rounded text-red-500 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                  <Lock className="w-3 h-3 text-red-500" />
                  <span>Aperçu verrouillé</span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-4 text-[#10b981] mt-2">
                    <Trophy className="w-4 h-4 text-[#10b981]" />
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-zinc-900 border border-brand-border px-2 py-0.5 rounded text-zinc-400 font-bold">{ch.lang}</span>
                  </div>
                  <h4 className="font-serif italic text-lg text-zinc-100 group-hover:text-[#10b981] transition-colors">{ch.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2 mb-6 font-medium">{ch.desc}</p>
                </div>

                <div className="border-t border-[#27272a]/60 pt-4 mt-auto">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mb-4">
                    <span>Performance visée :</span>
                    <span className="text-emerald-400 font-extrabold">{ch.metric}</span>
                  </div>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-2.5 bg-[#18181b] hover:bg-[#1f1f23] border border-[#27272a] hover:border-zinc-600 rounded-xl text-xs text-zinc-300 font-bold tracking-wide transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Se connecter pour tenter</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* METRICS SECTION WITH STUNNING CTA */}
        <section className="bg-gradient-to-r from-[#031c19] via-[#051111] to-[#011413] border border-[#10b981]/30 rounded-2xl p-8 md:p-12 relative flex flex-col items-center justify-center text-center overflow-hidden gap-6 shadow-2xl">
          {/* Nebula dust in card */}
          <div className="absolute inset-0 bg-radial-at-c from-[#14533e]/15 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-serif italic text-[#DAF1DE]">
              "Le code est l'ADN du Cosmos."
            </h2>
            <p className="text-xs text-[#10b981] font-mono uppercase font-black tracking-widest mt-1">Prêt à entamer la mise à feu ?</p>
            <p className="text-xs text-brand-muted leading-relaxed max-w-xl mx-auto mt-2">
              Inscrivez-vous sur le réseau CodeArena de manière entièrement sécurisée et commencez à résoudre des algorithmes stellaires asynchrones aujourd'hui.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={() => {
                if (user) onEnterArena("challenges");
                else setShowAuthModal(true);
              }}
              className="bg-[#10b981] hover:bg-[#34d399] text-[#09090b] font-black font-sans text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl text-center cursor-pointer transition-all hover:scale-105"
            >
              Lancer un Défi maintenant
            </button>
            <button
              onClick={() => {
                if (user) onEnterArena("leaderboard");
                else setShowAuthModal(true);
              }}
              className="bg-transparent hover:bg-neutral-800 text-brand-primary border border-brand-border font-bold font-sans text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl text-center cursor-pointer transition-all"
            >
              Voir le Leaderboard Céleste
            </button>
          </div>
        </section>

      </div>

      {/* Embedded inline keyframes specifically with custom spin rules */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>

      {/* AUTH MODAL DIRECTEMENT SUR LA LANDING PAGE */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop filter blur with stars behind */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative max-w-sm w-full bg-[#121214] border border-[#27272a] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl overflow-hidden premium-glow z-10 text-left"
            >
              {/* Star trail inside modal */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

              {/* Header with close button */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wide">Liaison Grille Cosmique</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">CodeArena Network Terminal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="p-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informative subline */}
              <p className="text-xs text-zinc-400 leading-normal relative z-10 font-medium">
                Saisissez vos identifiants pour synchroniser vos profils de codage, de classement et de duels Firebase.
              </p>

              {/* Form segment */}
              <form onSubmit={authMode === "signin" ? handleEmailSignIn : handleEmailSignUp} className="flex flex-col gap-4 relative z-10 font-sans">
                {authError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-500 rounded-xl text-[11px] flex items-start gap-2 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-extrabold font-bold">Pseudonyme d'Officier</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: NeilArmstrong"
                        className="w-full bg-[#18181b] border border-[#27272a] focus:border-emerald-500/80 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-extrabold font-bold">Email de communication</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pilote@nasa.gov"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-emerald-500/80 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-extrabold font-bold">Clé d'authentification</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-emerald-500/80 rounded-xl py-3 pl-10 pr-10 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 mt-2 bg-[#10b981] hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : authMode === "signin" ? (
                    <span>Se Connecter</span>
                  ) : (
                    <span>Créer le Compte</span>
                  )}
                </button>
              </form>

              {/* Switch Signin / Signup mode */}
              <div className="text-center relative z-10 text-xs">
                <button 
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "signin" ? "signup" : "signin");
                    setAuthError("");
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono uppercase tracking-wider cursor-pointer font-bold"
                >
                  {authMode === "signin" ? "Créer un compte d'Officier →" : "← Déjà enregistré ? Se connecter"}
                </button>
              </div>

              {/* Social authentication widgets */}
              <div className="flex flex-col gap-3 relative z-10 border-t border-[#27272a]/60 pt-5">
                <div className="text-center">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Ou via SSO direct</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={authLoading}
                    className="py-2.5 bg-[#18181b] hover:bg-[#202022] border border-[#27272a] rounded-xl text-[11px] text-zinc-300 font-bold cursor-pointer hover:border-zinc-600 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                  >
                    <span>Google</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSocialSignIn("github")}
                    disabled={authLoading}
                    className="py-2.5 bg-[#18181b] hover:bg-[#202022] border border-[#27272a] rounded-xl text-[11px] text-zinc-300 font-bold cursor-pointer hover:border-zinc-600 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                  >
                    <span>GitHub</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
