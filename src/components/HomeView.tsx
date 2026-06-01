import React, { useState, useEffect } from "react";
import { Cpu, Terminal, Play, Plus, Clock, Database, Code, Circle, RefreshCw } from "lucide-react";
import { Project } from "../types";

interface HomeViewProps {
  onStartProject: (project: Project) => void;
  onNewProject: () => void;
  recentProjects: Project[];
}

export default function HomeView({ onStartProject, onNewProject, recentProjects }: HomeViewProps) {
  const [metricTab, setMetricTab] = useState<"CPU" | "RAM">("CPU");
  const [terminalTicks, setTerminalTicks] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Initial prompt test log output simulation
  const defaultLogs = [
    "[INFO] Initializing test environment...",
    "[INFO] Loading database schemas...",
    "[PASS] auth_token_validation (12ms)",
    "[PASS] session_timeout_handling (4ms)",
    "[WARN] rate_limit_threshold_near (92% of maximum limit)",
    "[PASS] token_context_handshake (22ms)",
    "[INFO] System ready for deployment. Status: Green"
  ];

  useEffect(() => {
    // Stagger terminal print for rich dynamic feeling on mount
    let index = 0;
    const interval = setInterval(() => {
      if (index < defaultLogs.length) {
        setTerminalTicks(prev => [...prev, defaultLogs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const runManualTests = () => {
    if (isTestRunning) return;
    setIsTestRunning(true);
    setTerminalTicks(prev => [...prev, "", "user@codearena:~$ ./run_tests.sh --module=interactive-perf"]);
    
    setTimeout(() => {
      setTerminalTicks(prev => [...prev, "[INFO] Compiling modules..."]);
    }, 500);

    setTimeout(() => {
      setTerminalTicks(prev => [...prev, "[PASS] main_execution_cycle (1.2ms)"]);
    }, 1000);

    setTimeout(() => {
      setTerminalTicks(prev => [...prev, "[SUCCESS] All tests executed successfully.", ""]);
      setIsTestRunning(false);
    }, 1500);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalTicks(prev => [...prev, `user@codearena:~$ ${cmd}`]);
    setTerminalInput("");
    
    // Simple custom answers
    setTimeout(() => {
      if (cmd === "help" || cmd === "aide") {
        setTerminalTicks(prev => [
          ...prev, 
          "Commandes disponibles :",
          "  clear           Vider l'historique de la console",
          "  npm run dev     Démarrer le serveur de développement local",
          "  run_tests       Exécuter les batteries d'algorithmes intégrées"
        ]);
      } else if (cmd === "clear" || cmd === "cls") {
        setTerminalTicks([]);
      } else if (cmd === "npm run dev") {
        setTerminalTicks(prev => [
          ...prev, 
          "VITE v4.3.9 ready in 245 ms",
          "  ➜  Local:   http://localhost:3000/",
          "  ➜  Network: use --host to expose"
        ]);
      } else if (cmd === "run_tests") {
        runManualTests();
      } else {
        setTerminalTicks(prev => [...prev, `sh: command not found: ${cmd}. Tapez 'help' pour voir la liste.`]);
      }
    }, 150);
  };

  // Custom charts mock heights representing metrics data
  const cpuHeightData = [40, 65, 85, 95, 50, 30, 45];
  const ramHeightData = [60, 45, 55, 75, 90, 80, 70];
  const currentHeightData = metricTab === "CPU" ? cpuHeightData : ramHeightData;
  const daysOfTheWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex-1 overflow-y-auto p-10 select-none max-w-7xl mx-auto w-full font-sans">
      {/* Title section with display font styling */}
      <div className="mb-10 flex flex-col gap-1.5">
        <h2 className="text-3xl font-serif italic text-white tracking-tight">
          Tableau de bord de production
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
          Statut de l'arène : OPÉRATIONNEL • Télémétrie CodeArena active
        </p>
      </div>

      {/* Grid containing performance bar telemetry & zsh terminal */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Execution performance bar card (8 columns) */}
        <div className="col-span-12 lg:col-span-8 bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-[#27272a] duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Performances d'Exécution</span>
            </h3>
            {/* Toggles */}
            <div className="flex gap-2.5 bg-[#09090b] p-1 rounded-lg border border-[#27272a]">
              <button
                onClick={() => setMetricTab("CPU")}
                className={`px-3 py-1 text-xs rounded transition-all font-mono tracking-wider font-semibold cursor-pointer ${
                  metricTab === "CPU"
                    ? "bg-[#18181b] text-emerald-400 border border-[#27272a]/30"
                    : "text-zinc-500 hover:text-[#fafafa]"
                }`}
              >
                CPU
              </button>
              <button
                onClick={() => setMetricTab("RAM")}
                className={`px-3 py-1 text-xs rounded transition-all font-mono tracking-wider font-semibold cursor-pointer ${
                  metricTab === "RAM"
                    ? "bg-[#18181b] text-emerald-400 border border-[#27272a]/30"
                    : "text-zinc-400 hover:text-[#fafafa]"
                }`}
              >
                RAM
              </button>
            </div>
          </div>

          {/* Graphical representation element with grid telemetry lines */}
          <div className="flex-grow min-h-[220px] relative flex flex-col justify-end w-full px-2 pt-4">
            <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-[0.05]">
              <div className="w-full h-px bg-[#fafafa]"></div>
              <div className="w-full h-px bg-[#fafafa]"></div>
              <div className="w-full h-px bg-[#fafafa]"></div>
              <div className="w-full h-px bg-[#fafafa]"></div>
            </div>

            {/* Bars array */}
            <div className="flex items-end justify-between w-full h-full pb-3 z-10">
              {currentHeightData.map((height, idx) => {
                const isMax = idx === 3; // Peak highlight point matching Thursday peak
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-11/12">
                    <div 
                      style={{ height: `${height}%` }}
                      className={`w-11 rounded-sm transition-all duration-500 cursor-pointer ${
                        isMax 
                          ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
                          : "bg-[#18181b]/80 hover:bg-[#27272a]"
                      }`}
                      title={`${metricTab}: ${height === 95 ? "95% (Pic)" : height + "%"}`}
                    ></div>
                    <span className="font-mono text-[10px] text-zinc-500 font-medium">{daysOfTheWeek[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Console view mock shell frame (4 columns) */}
        <div className="col-span-12 lg:col-span-4 bg-[#121214] border border-[#27272a] rounded-2xl flex flex-col hover:border-zinc-700 transition-colors duration-300 overflow-hidden">
          {/* Header */}
          <div className="h-10 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between px-4 select-none">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">arena-shell ~ prompt</span>
            <button 
              onClick={runManualTests}
              title="Exécuter tests"
              className="text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestRunning ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>

          {/* Terminal log dynamic rows */}
          <div className="flex-grow p-4 min-h-[220px] font-mono text-[11px] overflow-y-auto flex flex-col justify-end gap-1 bg-[#09090b]/20">
            <div className="flex flex-col gap-1.5 text-zinc-400">
              <div className="flex items-center text-zinc-200 font-bold">
                <span className="text-emerald-500 mr-2 bg-[#18181b] px-1.5 py-0.5 rounded text-[9px]">➜</span>
                <span>~ ./run_tests.sh --module=auth</span>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto max-h-48 scrollbar-thin">
                {terminalTicks.map((tick, index) => {
                  if (!tick) return null;
                  let styleClass = "text-zinc-400";
                  if (tick.includes("[PASS]")) styleClass = "text-emerald-400 font-bold";
                  if (tick.includes("[SUCCESS]")) styleClass = "text-emerald-400 font-extrabold";
                  if (tick.includes("[WARN]")) styleClass = "text-amber-500 font-medium";
                  if (tick.includes("user@codearena")) styleClass = "text-[#fafafa] font-bold pt-1";
                  
                  return (
                    <p key={index} className={styleClass}>
                      {tick}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Input line */}
            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 border-t border-[#27272a]/20 pt-2 mt-2">
              <span className="text-emerald-400 font-bold text-[10px]">user@codearena:~$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Tapez 'npm run dev' ou 'help'..."
                className="flex-grow bg-transparent border-none text-[#fafafa] focus:outline-none font-mono text-[11px]"
              />
              <span className="w-1.5 h-3.5 bg-emerald-500 animate-pulse"></span>
            </form>
          </div>
        </div>
      </div>

      {/* Recent launched projects widget */}
      <div className="col-span-12 bg-[#121214] border border-[#27272a] rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-[#27272a] duration-300">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-5 flex items-center gap-2.5">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Projets Récents</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onStartProject(project)}
              className="bg-[#18181b] rounded-xl p-5 border border-[#27272a]/60 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-[#121214] rounded-lg text-emerald-400 group-hover:scale-105 transition-transform border border-[#27272a]">
                    {project.language === "Rust" ? (
                      <Code className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Database className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#09090b] text-zinc-500 border border-[#27272a]/50 rounded font-mono text-[10px] uppercase font-bold tracking-wider">
                    {project.language}
                  </span>
                </div>
                <h4 className="text-[#fafafa] font-serif italic text-base group-hover:text-emerald-400 transition-colors">
                  {project.name}
                </h4>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-5 font-mono">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span>Modifié {project.modifiedAt}</span>
              </div>
            </div>
          ))}

          {/* New project card action triggers */}
          <div
            onClick={onNewProject}
            className="bg-transparent rounded-xl p-5 border border-[#27272a] border-dashed hover:border-[#10b981] hover:bg-[#18181b]/30 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center group min-h-[170px]"
          >
            <div className="p-3 bg-[#18181b] rounded-full text-emerald-400 mb-3 group-hover:scale-[1.05] transition-transform border border-[#27272a]">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 uppercase tracking-widest">
              Créer un projet
            </span>
            <span className="text-[10px] text-zinc-500 mt-1">
              Commencer un canevas vierge
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
