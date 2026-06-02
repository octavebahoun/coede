import { auth } from "../firebase";
import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  User, 
  Send, 
  Terminal, 
  ShieldAlert, 
  Play, 
  Award, 
  Code,
  X 
} from "lucide-react";
import { Challenge, ChatMessage, DuelRoom } from "../types";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

interface DuelsProps {
  user: any;
  onDuelWin: () => void;
  onDuelLoss: () => void;
}

export default function DuelsView({ user, onDuelWin, onDuelLoss }: DuelsProps) {
  const [roomState, setRoomState] = useState<"initial" | "searching" | "matched" | "dueling" | "results">("initial");
  const [copiedId, setCopiedId] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [logTicks, setLogTicks] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userChatMsg, setUserChatMsg] = useState("");
  const [duelTimeLeft, setDuelTimeLeft] = useState(90); // 1.5 min duel for accelerated fun!
  const [userSubmitted, setUserSubmitted] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  
  // Real BDD room states
  const [roomCode, setRoomCode] = useState<string>("FR-892-XZ");
  const [roomDocId, setRoomDocId] = useState<string | null>(null);
  const [roomModel, setRoomModel] = useState<any | null>(null);
  const [joinRoomInput, setJoinRoomInput] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Fight dynamic states
  const [userDuelCode, setUserDuelCode] = useState<string>("");
  const [userCalculatedScore, setUserCalculatedScore] = useState(0);
  const [opponentCalculatedScore, setOpponentCalculatedScore] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const duelLogsRef = useRef<HTMLDivElement>(null);
  const duelChatRef = useRef<HTMLDivElement>(null);

  const initialLogs = [
    "[16:19:02] Connexion au serveur central d'arène d'Europe... OK",
    "[16:19:03] Authentification des ports d'accès... OK",
    "[16:19:05] Prêt à lancer une recherche d'arène en direct..."
  ];

  const opponentQuotes = [
    "Salut ! Que le meilleur codeur gagne !",
    "Oh, un adversaire de taille ! Ça va être un sacré combat !",
    "Perso, j'optimise mon attention en Rust. Toi tu vas coder en quoi ?",
    "Défi d'arène chargé. L'algorithme a l'air corsé, bonne chance !"
  ];

  // Initialize logs on screen load
  useEffect(() => {
    if (roomState === "initial") {
      setLogTicks(initialLogs);
    }
  }, [roomState]);

  // Matchmaking trigger using real Express API with Firestore write
  const handleStartMatchmaking = async () => {
    setRoomState("searching");
    setMatchProgress(0);
    setLogTicks(prev => [...prev, "[16:19:42] Lancement de la file de sélection... Recherche d'un adversaire..."]);
    setErrorAlert(null);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/duels/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const lobby = await res.json();
        setRoomModel(lobby);
        setRoomCode(lobby.roomId);
        setRoomDocId(lobby.id);
        setLogTicks(prev => [
          ...prev, 
          `[16:19:43] Salon créé sur Firestore ! ID : #${lobby.roomId}`,
          "[16:19:44] En attente de connexion d'un adversaire..."
        ]);
      } else {
        const txt = await res.text();
        console.error("Erreur de création de duel", txt);
        setLogTicks(prev => [...prev, `[ERREUR] Impossible de créer : ${txt}`]);
      }
    } catch (err: any) {
      console.error(err);
      setLogTicks(prev => [...prev, `[ERREUR] ${err.message}`]);
    }
  };

  // Join Room by code manually
  const handleJoinByCode = async () => {
    if (!joinRoomInput.trim()) return;
    setIsJoining(true);
    setErrorAlert(null);
    setLogTicks(prev => [...prev, `[HTTP] Recherche du salon #${joinRoomInput}...`]);
    try {
      const token2 = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/duels/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token2}` },
        body: JSON.stringify({ roomId: joinRoomInput.trim() })
      });
      if (res.ok) {
        const lobby = await res.json();
        setRoomModel(lobby);
        setRoomCode(lobby.roomId);
        setRoomDocId(lobby.id);
        setRoomState("matched");
        setLogTicks(prev => [
          ...prev,
          `[16:19:47] Connexion avec succès au salon de ${lobby.player1.username} !`
        ]);
        setChatMessages([
          { id: "s1", sender: "System", text: `Vous avez rejoint la salle de ${lobby.player1.username}.`, timestamp: "À l'instant" }
        ]);
      } else {
        const errTxt = await res.text();
        setErrorAlert(errTxt);
        setLogTicks(prev => [...prev, `[ERREUR] Impossible de rejoindre : ${errTxt}`]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorAlert(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Polling / Matchmaking verification from database + simulated auto-matching fallback
  useEffect(() => {
    if (roomState !== "searching" || !roomCode || !roomDocId) return;

    let secondsElapsed = 0;
    const progressTimer = setInterval(() => {
      secondsElapsed++;
      setMatchProgress(secondsElapsed);
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
        const res = await fetch(`/api/duels/${roomCode}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const updatedLobby = await res.json();
          setRoomModel(updatedLobby);
          if (updatedLobby.player2) {
            clearInterval(pollInterval);
            clearInterval(progressTimer);
            setRoomState("matched");
            setLogTicks(prev => [
              ...prev,
              `[16:19:47] Adversaire connecté : ${updatedLobby.player2.username} !`,
              "[16:19:48] Connecté au chat de salon en temps réel."
            ]);
            setChatMessages([
              { id: "s1", sender: "System", text: `${updatedLobby.player2.username} a rejoint la salle d'attente #${roomCode}.`, timestamp: "À l'instant" }
            ]);
          }
        }
      } catch (err) {
        console.warn("Erreur durant la vérification du salon:", err);
      }
    }, 2000);

    // Fallback: If no real opponent joins after 5 seconds, auto-inject AlexCoder_99 in Firestore!
    const fallbackTimeout = setTimeout(async () => {
      try {
        const rRef = doc(db, "duels", roomDocId);
        const autoOpponent = {
          username: "AlexCoder_99",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
          level: 5,
          email: "alex_coder99@codearena.com"
        };
        await updateDoc(rRef, {
          player2: autoOpponent,
          status: "ready"
        });
        setLogTicks(prev => [...prev, "[SYSTEM] Placement d'un ingénieur compatible disponible..."]);
      } catch (err) {
        console.error("Échec de la configuration automatique de l'adversaire de matchmaking", err);
      }
    }, 4500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(pollInterval);
      clearTimeout(fallbackTimeout);
    };
  }, [roomState, roomCode, roomDocId]);

  // Autoscroll logs & chats
  useEffect(() => {
    duelLogsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logTicks]);

  useEffect(() => {
    duelChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Copy click animation
  const handleCopyId = () => {
    navigator.clipboard.writeText("#" + (roomCode || "FR-892-XZ"));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Chat message submit by user (connected to Gemini live opponent API)
  const handleSendMessage = async () => {
    if (!userChatMsg.trim() || isChatLoading) return;
    const msg = userChatMsg.trim();
    setUserChatMsg("");

    const currentSender = user?.username || "GuillaumeD";

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: currentSender as any,
      text: msg,
      timestamp: "À l'instant"
    };

    const updatedHistory = [...chatMessages, newMsg];
    setChatMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const token3 = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const response = await fetch("/api/opponent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token3}` },
        body: JSON.stringify({
          message: msg,
          history: updatedHistory
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "Adversaire",
        text: data.reply || "Concentrons-nous sur le code !",
        timestamp: "À l'instant"
      }]);
    } catch (error) {
      console.error(error);
      const randomQuote = opponentQuotes[Math.floor(Math.random() * opponentQuotes.length)];
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "Adversaire",
        text: randomQuote,
        timestamp: "À l'instant"
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Launch the synchronized code dueling with real Firestore update
  const handleStartDuelCoding = async () => {
    if (roomDocId) {
      try {
        await updateDoc(doc(db, "duels", roomDocId), { status: "coding" });
      } catch (err) {
        console.warn("Échec d'écriture d'état de début d'arène dans Firestore:", err);
      }
    }
    setRoomState("dueling");
    setDuelTimeLeft(75); // Stagger 75s matching
    setUserSubmitted(false);
    setOpponentSubmitted(false);
    setUserDuelCode(`// DÉFI DUEL : Tri de nœuds de graphe accéléré
// Entrée : graphe orienté contenant des liaisons de coordonnées.
// Sortie : tableau trié par distance de Manhattan.

function solveGraphPath(nodes, origin) {
  // TODO: Écrivez votre algorithme d'optimisation ici
  return nodes;
}
`);

    // Simulated opponent submit timer
    setTimeout(() => {
      setOpponentSubmitted(true);
      const opp = roomModel?.player2?.username || "AlexCoder_99";
      setLogTicks(prev => [...prev, `[16:21:12] ${opp} a soumis sa solution !`]);
    }, 45000); // Opponent submits in 45 seconds
  };

  // Countdown timer inside active duel
  useEffect(() => {
    let interval: any = null;
    if (roomState === "dueling" && duelTimeLeft > 0) {
      interval = setInterval(() => {
        setDuelTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (duelTimeLeft === 0 && roomState === "dueling") {
      handleEvaluateDuelResult();
    }
    return () => clearInterval(interval);
  }, [roomState, duelTimeLeft]);

  const handleEvaluateDuelResult = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setUserSubmitted(true);

    try {
      const token4 = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const response = await fetch("/api/challenges/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token4}` },
        body: JSON.stringify({
          challenge: {
            title: "Tri de nœuds de graphe accéléré",
            description: "Tri de nœuds de graphe orienté contenant des liaisons de coordonnées par distance de Manhattan."
          },
          userFiles: { "main.js": userDuelCode }
        })
      });
      const data = await response.json();
      
      const uScore = data.score !== undefined ? data.score : 80;
      const oScore = 78 + Math.floor(Math.random() * 15);

      setUserCalculatedScore(uScore);
      setOpponentCalculatedScore(oScore);
      setRoomState("results");

      if (uScore > oScore) {
        onDuelWin();
      } else {
        onDuelLoss();
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const lineCount = userDuelCode.split("\n").filter(l => l.trim().length > 3).length;
      const uScore = Math.min(75 + lineCount * 4, 98);
      const oScore = 78 + Math.floor(Math.random() * 15);

      setUserCalculatedScore(uScore);
      setOpponentCalculatedScore(oScore);
      setRoomState("results");

      if (uScore > oScore) {
        onDuelWin();
      } else {
        onDuelLoss();
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex-grow flex h-full overflow-hidden select-none font-sans">
      <div className="flex-grow overflow-y-auto p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* DUELS CHANNELS NAVIGATION BAR */}
        <div className="flex justify-between items-end pb-4 border-b border-brand-border/40 select-none">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-brand-active text-brand-primary text-[9px] font-bold tracking-wider rounded border border-brand-border uppercase">Mode Duel</span>
              <span className="px-2 py-0.5 bg-brand-active text-brand-primary text-[9px] font-bold tracking-wider rounded border border-brand-border uppercase">Classé</span>
            </div>
            <h2 className="font-sans font-extrabold text-4xl text-[#DAF1DE] uppercase m-0 leading-none">
              {roomState === "dueling" ? "Arène de Combat" : "Salle d'Attente"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-brand-muted mb-1.5 font-bold uppercase tracking-wider">ID du Salon</p>
              <div className="flex items-center bg-brand-surface border border-brand-border rounded-xl px-3.5 py-1.5 gap-3.5 shadow-sm">
                <span className="font-mono text-xs tracking-wider text-brand-primary">#{roomCode || "FR-892-XZ"}</span>
                <button 
                  onClick={handleCopyId}
                  className="text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                  title="Copier"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LOBBY LUNCH MACHINE SCREEN */}
        {roomState !== "dueling" && roomState !== "results" && (
          <div className="grid grid-cols-12 gap-6 flex-grow min-h-[480px]">
            
            {/* Left large card showing dynamic matchmaking status */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* Versus widget */}
              <div className="flex-grow bg-brand-surface border border-brand-border rounded-2xl relative flex items-center justify-center p-8 group hover:border-[#8EB69B]/30 transition-colors premium-glow">
                
                {/* Visual grid lines divider */}
                <div className="absolute inset-0 flex opacity-[0.04] pointer-events-none">
                  <div className="w-1/2 border-r border-brand-primary"></div>
                  <div className="w-1/2"></div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-brand-darkest border border-brand-border rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(5,31,32,1)] select-none">
                  <span className="font-sans font-black text-xl text-brand-primary italic opacity-75">VS</span>
                </div>

                <div className="w-full flex justify-between items-center z-10 h-full">
                  {/* Participant 1: GuillaumeD (You) */}
                  <div className="w-5/12 flex flex-col items-center text-center gap-4 select-none">
                    <div className="w-24 h-24 rounded-full border-2 border-brand-primary p-1 relative">
                      <div className="absolute inset-0 rounded-full border border-brand-primary animate-ping opacity-10"></div>
                      <img 
                        alt="Votre Avatar" 
                        className="w-full h-full object-cover rounded-full filter grayscale contrast-125"
                        src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBZymiT42t-KbyZBIGa7_sgs9hcRwdVtrtQwk1ddrc3uRWIvLJz9RxRQdr-QBHYI47aMHC5m_FwnHUhM-PYFPKWMbYqao7k-oi3jM_cXFpeg1PUpLFQpzV14NWAHsGz6o8LJvZjm3smBJVu61x4px-ojGgMws7TF8SD3LiIunJIPXawI7f5ryyHNK3CRf65FkYK2gsmwvSsqxgz_u3OiXfE3046aTLvZ8p3pAjPtENjEOepLPZ7w1YntI6Zvwp4ZqL7Lg260W0HKis"}
                      />
                      <div className="absolute -bottom-1 right-2 bg-brand-darkest border border-brand-border rounded-xl px-2 py-0.5 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></div>
                        <span className="text-[9px] font-mono font-semibold">Prêt</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-sans font-bold text-[#DAF1DE] text-base leading-none">{user?.username || "GuillaumeD"}</h3>
                      <p className="text-brand-muted text-[11px] font-mono mt-1.5">Rang : {user?.rank || "Diamant III"}</p>
                      
                      <div className="mt-3 flex gap-1.5 justify-center">
                        <span className="px-2 py-0.5 bg-brand-active text-brand-primary text-[9px] rounded-lg border border-brand-border font-mono font-bold uppercase">Python</span>
                        <span className="px-2 py-0.5 bg-brand-active text-brand-primary text-[9px] rounded-lg border border-brand-border font-mono font-bold uppercase">Rust</span>
                      </div>
                    </div>
                  </div>

                  {/* Participant 2: Searching placeholder vs Paired Opponent details */}
                  <div className="w-5/12 flex flex-col items-center text-center gap-4">
                    {roomState === "searching" && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-brand-border flex items-center justify-center p-1 bg-brand-active/20 animate-pulse select-none">
                          <RefreshCw className="w-8 h-8 text-brand-muted animate-spin" />
                        </div>
                        <div>
                          <h3 className="font-sans font-bold text-brand-muted italic text-sm">Recherche...</h3>
                          <p className="text-brand-muted/50 text-[10px] font-mono mt-1">Estimation : 0:42</p>
                          <span className="text-xs font-mono text-brand-primary mt-1 font-bold">{matchProgress}s écoulés</span>
                        </div>
                      </div>
                    )}

                    {roomState === "initial" && (
                      <div className="flex flex-col items-center w-full max-w-sm gap-5">
                        <button
                          onClick={handleStartMatchmaking}
                          className="px-6 py-3 w-full bg-[#DAF1DE] text-[#051F20] hover:bg-opacity-90 rounded-xl font-sans font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(218,241,222,0.2)]"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Créer un Salon d'Arène</span>
                        </button>

                        <div className="flex items-center gap-3 w-full py-1.5">
                          <div className="flex-grow h-px bg-brand-border/30"></div>
                          <span className="text-[9px] font-mono text-brand-muted uppercase tracking-wider">OU rejoindre avec code</span>
                          <div className="flex-grow h-px bg-brand-border/30"></div>
                        </div>

                        <div className="flex w-full bg-[#051F20] border border-brand-border rounded-xl p-1 gap-1.5 shadow-sm">
                          <input
                            type="text"
                            placeholder="Ex : ROOM-482"
                            value={joinRoomInput}
                            onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                            className="bg-transparent text-xs font-mono px-3 py-2 flex-grow outline-none border-none text-brand-primary uppercase placeholder:text-brand-muted/40"
                          />
                          <button
                            disabled={isJoining || !joinRoomInput.trim()}
                            onClick={handleJoinByCode}
                            className="bg-brand-active text-brand-primary border border-brand-border hover:bg-brand-primary hover:text-brand-darkest px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                          >
                            {isJoining ? "Connexion..." : "Rejoindre"}
                          </button>
                        </div>
                        {errorAlert && (
                          <span className="text-[10px] text-rose-400 font-mono text-center">{errorAlert}</span>
                        )}
                      </div>
                    )}

                    {roomState === "matched" && (
                      <div className="flex flex-col items-center text-center gap-4 select-none animate-fadeIn">
                        <div className="w-24 h-24 rounded-full border-2 border-brand-primary p-1 relative">
                          <img 
                            alt="Votre Avatar" 
                            className="w-full h-full object-cover rounded-full filter grayscale contrast-125"
                            src={roomModel?.player2?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80"}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-[#1a4435] border border-[#2c6e54] rounded-full p-1 shadow-md">
                            <Award className="w-4 h-4 text-brand-primary" />
                          </div>
                        </div>

                        <div>
                          <h3 className="font-sans font-bold text-brand-primary text-base leading-none">
                            {roomModel?.player2?.username || "AlexCoder_99"}
                          </h3>
                          <p className="text-brand-muted text-[11px] font-mono mt-1.5">
                            Rang : {roomModel?.player2?.username ? `Elite (Niveau ${roomModel.player2.level})` : "Rang : Diamant II"}
                          </p>
                          
                          <div className="mt-3 flex gap-1.5 justify-center">
                            <span className="px-2 py-0.5 bg-[#4c1d1a] text-rose-300 text-[9px] rounded-lg border border-rose-500/30 font-mono font-bold uppercase">C++</span>
                            <span className="px-2 py-0.5 bg-brand-active text-brand-primary text-[9px] rounded-lg border border-brand-border font-mono font-bold uppercase">Rust</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Match settings parameters footer */}
              {roomState === "matched" && (
                <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex items-center justify-between gap-4 select-none animate-fadeIn">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-brand-muted uppercase tracking-wider font-bold">Algorithme d'arène</span>
                      <span className="font-mono text-xs text-brand-primary font-bold flex items-center gap-1.5">Tri Graphe Distributivité</span>
                    </div>
                    <div className="w-px h-8 bg-brand-border/30"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-brand-muted uppercase tracking-wider font-bold">Durée duel</span>
                      <span className="font-mono text-xs text-brand-primary font-bold flex items-center gap-1.5">15 Minutes (Format Court)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartDuelCoding}
                    className="bg-brand-primary text-brand-darkest hover:bg-opacity-95 text-xs py-2 px-5 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_10px_rgba(218,241,222,0.3)] cursor-pointer"
                  >
                    Démarrer le Combat
                  </button>
                </div>
              )}
            </div>

            {/* Right panel: Live Matchmaking System logs & Salon Conversations chat */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              
              {/* System Console Logs */}
              <div className="bg-[#051F20]/75 border border-brand-border rounded-xl flex flex-col h-1/2 overflow-hidden premium-glow">
                <div className="bg-brand-active/40 h-8 border-b border-brand-border flex items-center px-4 gap-2">
                  <Terminal className="w-3.5 h-3.5 text-brand-muted" />
                  <span className="text-[10px] text-brand-muted font-mono font-bold uppercase tracking-wider">System Log</span>
                </div>

                <div className="p-4 font-mono text-[10px] flex flex-col gap-1.5 overflow-y-auto flex-grow text-brand-muted h-32 scrollbar-thin">
                  {logTicks.map((tick, index) => {
                    if (!tick) return null;
                    return (
                      <p key={index} className={tick.includes("Adversaire") ? "text-emerald-400 font-bold" : ""}>
                        {tick}
                      </p>
                    );
                  })}
                  <div ref={duelLogsRef} />
                </div>
              </div>

              {/* Chat room */}
              <div className="bg-brand-surface border border-brand-border rounded-xl flex flex-col h-1/2 overflow-hidden premium-glow">
                <div className="bg-brand-active/40 h-8 border-b border-brand-border flex justify-between items-center px-4">
                  <span className="text-[10px] text-brand-primary font-mono font-bold uppercase tracking-wider">Chat de Salon</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${roomState === "matched" ? "bg-emerald-400 animate-pulse" : "bg-brand-border"}`}></div>
                    <span className="text-[9px] font-mono text-brand-muted">{roomState === "matched" ? "Partenaire actif" : "Lobby vide"}</span>
                  </div>
                </div>

                {/* Bubble displays */}
                <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-2.5 h-32 scrollbar-thin">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center text-center h-full text-xs text-brand-muted italic mt-4 font-sans select-none">
                      En attente d'un adversaire pour commencer à discuter...
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isYou = msg.sender === (user?.username || "GuillaumeD") || msg.sender === "GuillaumeD";
                      const isSys = msg.sender === "System";
                      if (isSys) {
                        return (
                          <div key={msg.id} className="text-center font-mono text-[9px] text-[#DAF1DE]/60 my-1 font-bold">
                            — {msg.text} —
                          </div>
                        );
                      }
                      return (
                        <div 
                          key={msg.id} 
                          className={`max-w-[85%] rounded-lg p-2.5 text-[11px] leading-relaxed font-sans ${
                            isYou 
                              ? "bg-brand-primary text-brand-darkest self-end font-medium" 
                              : "bg-brand-active/20 text-[#DAF1DE] border border-brand-border/20 self-start"
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                      );
                    })
                  )}
                  {isChatLoading && (
                    <div className="bg-brand-active/20 text-[#DAF1DE]/70 border border-brand-border/10 self-start rounded-lg p-2 px-3 text-[11px] max-w-[85%] animate-pulse font-sans flex flex-col gap-1">
                      <span className="font-bold text-[9px] text-[#8EB69B]">{roomModel?.player2?.username || "AlexCoder_99"}</span>
                      <span className="italic">Rédaction du message en cours...</span>
                    </div>
                  )}
                  <div ref={duelChatRef} />
                </div>

                {/* Text submission input */}
                <div className="p-2.5 border-t border-brand-border/40 bg-brand-darkest/15">
                  <div className="relative">
                    <input
                      disabled={roomState !== "matched"}
                      type="text"
                      value={userChatMsg}
                      onChange={(e) => setUserChatMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={roomState === "matched" ? "Tapez pour discuter d'avant-match..." : "Lobby discussion inactif..."}
                      className="w-full bg-brand-darkest border border-brand-border rounded-lg px-3 py-1.5 pr-10 text-xs text-brand-primary focus:outline-none focus:border-brand-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={roomState !== "matched"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* COMPETING LIVE FIGHT CODING SCREEN (Dual layout) */}
        {roomState === "dueling" && (
          <div className="flex-1 flex flex-col bg-brand-surface border border-brand-border rounded-2xl overflow-hidden premium-glow select-none animate-fadeIn">
            {/* Countdown alert bar */}
            <div className="h-12 bg-brand-darkest border-b border-brand-border flex items-center justify-between px-6 shrink-0">
              <span className="text-xs font-bold font-sans text-brand-primary flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-primary animate-pulse" /> DUEL CONTRE {(roomModel?.player2?.username || "AlexCoder_99").toUpperCase()}
              </span>

              {/* Countdown clock */}
              <div className="bg-[#5c1c18]/20 border border-rose-500/30 px-3 py-1 text-rose-400 font-mono text-xs rounded-full flex items-center gap-2 font-bold animate-pulse">
                <span>CHRONO : {duelTimeLeft}s</span>
              </div>
            </div>

            {/* Side-by-side editing blocks representation */}
            <div className="flex-1 flex min-h-0">
              
              {/* Left pane: Your actual active textarea editor */}
              <div className="flex-1 flex flex-col border-r border-brand-border">
                <div className="h-8 bg-brand-active/30 border-b border-brand-border flex items-center px-4 justify-between font-mono text-[10px] text-brand-muted">
                  <span>VOTRE ÉDITEUR : main.js</span>
                  <span className="text-emerald-400 font-semibold">{userSubmitted ? "SOUMIS !" : "MODIFICATION EN COURS"}</span>
                </div>

                <div className="flex-1 p-4 relative">
                  <textarea
                    disabled={userSubmitted}
                    value={userDuelCode}
                    onChange={(e) => setUserDuelCode(e.target.value)}
                    className="w-full h-full bg-brand-darkest/35 text-brand-primary focus:outline-none p-4 rounded-xl border border-brand-border/60 font-mono text-[11px] leading-relaxed resize-none cursor-text disabled:opacity-75 caret-brand-primary"
                  />
                </div>
              </div>

              {/* Right pane: Opponent's simulated code progression */}
              <div className="w-[300px] bg-brand-darkest flex flex-col shrink-0 overflow-hidden text-brand-muted">
                <div className="h-8 bg-brand-active/30 border-b border-brand-border flex items-center px-4 justify-between font-mono text-[10px]">
                  <span>ADVERSAIRE : {roomModel?.player2?.username || "AlexCoder_99"}</span>
                  <span className={`${opponentSubmitted ? "text-emerald-400 font-bold animate-pulse" : "text-amber-500"}`}>
                    {opponentSubmitted ? "SOUMIS !" : "EN TRAIN DE CODER"}
                  </span>
                </div>

                <div className="p-4 flex-grow font-mono text-[9px] text-brand-border/60 whitespace-pre overflow-hidden leading-relaxed select-none">
                  {`// Mode Duel - Langue : Rust
// Compilateur @rustc actif...

fn main() {
    let mut grid = vec![0; 50];
    let origin = Point::new(0, 0);
    
    // ${roomModel?.player2?.username || "AlexCoder_99"} est en cours de code...
    while let Some(n) = grid.pop() {
        println!("Index de Manhattan: {}", n);
    }
}`}
                </div>
              </div>
            </div>

            {/* Duel action submit bar */}
            <div className="h-14 bg-brand-darkest border-t border-brand-border flex items-center justify-end px-6 select-none">
              <button
                disabled={userSubmitted || isEvaluating}
                onClick={handleEvaluateDuelResult}
                className="bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed text-brand-darkest hover:bg-opacity-95 text-xs py-2 px-6 rounded-xl font-extrabold cursor-pointer active:scale-95 transition-all shadow-[0_0_8px_rgba(218,241,222,0.3)] flex items-center gap-1.5"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-brand-darkest" />
                    Évaluation IA en cours...
                  </>
                ) : (
                  "Soumettre & Finaliser"
                )}
              </button>
            </div>
          </div>
        )}

        {/* FIGHT RESULTS SCOREBOARD OUTCOMES SCREEN (Display) */}
        {roomState === "results" && (
          <div className="flex-1 bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-xl mx-auto w-full flex flex-col justify-center items-center premium-glow animate-fadeIn">
            <div className="w-16 h-16 bg-brand-active rounded-full flex items-center justify-center text-brand-primary mb-4 shadow-[0_0_15px_rgba(218,241,222,0.2)]">
              <Zap className="w-8 h-8 text-brand-primary fill-brand-primary" />
            </div>

            <h3 className="text-xl font-sans font-black text-[#DAF1DE] uppercase mb-1">TABLEAU DES SCORES</h3>
            <p className="text-xs text-brand-muted mb-8 font-semibold">Duel d'arène complété avec succès !</p>

            {/* Score cards comparisons */}
            <div className="w-full flex justify-between gap-6 mb-8 select-none">
              {/* You */}
              <div className="flex-1 bg-brand-darkest/80 border border-brand-border p-5 rounded-2xl text-center">
                <span className="text-[10px] text-brand-muted font-bold font-mono uppercase tracking-wider block mb-2">VOUS ({(user?.username || "GuillaumeD").toUpperCase()})</span>
                <span className="text-4xl font-black text-brand-primary font-mono">{userCalculatedScore}%</span>
                <span className="text-[10px] text-emerald-400 font-bold block mt-2">Délai optimal</span>
              </div>

              {/* Opponent */}
              <div className="flex-1 bg-brand-darkest/80 border border-brand-border p-5 rounded-2xl text-center">
                <span className="text-[10px] text-brand-muted font-bold font-mono uppercase tracking-wider block mb-2">{(roomModel?.player2?.username || "AlexCoder_99").toUpperCase()}</span>
                <span className="text-4xl font-black text-rose-300 font-mono">{opponentCalculatedScore}%</span>
                <span className="text-[10px] text-brand-muted block mt-2">Délai standard</span>
              </div>
            </div>

            {/* Outcome declaration banner */}
            <div className="bg-brand-active/20 border border-brand-border/40 p-4 rounded-xl leading-relaxed text-center w-full mb-8">
              {userCalculatedScore > opponentCalculatedScore ? (
                <div>
                  <p className="text-sm font-bold text-brand-primary uppercase tracking-wide">🏆 VICTOIRE D'ARÈNE !</p>
                  <p className="text-xs text-brand-muted mt-1 leading-normal">
                    Félicitations {user?.username || "GuillaumeD"} ! Vous remportez le combat. Vous gagnez +45 XP et consolidez votre MMR d'ingénieur.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-amber-500 uppercase tracking-wide">COMBAT SERRÉ !</p>
                  <p className="text-xs text-brand-muted mt-1 leading-normal">
                    {roomModel?.player2?.username || "AlexCoder_99"} a conçu une solution algorithmique légèrement plus compacte. Vous gagnez +10 XP de consolation.
                  </p>
                </div>
              )}
            </div>

            {/* Quick exit options */}
            <button
              onClick={() => {
                setRoomState("initial");
              }}
              className="w-full bg-brand-primary text-brand-darkest hover:bg-opacity-90 py-3 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer active:scale-[0.98] transition-all shadow"
            >
              Retourner à l'Accueil
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
