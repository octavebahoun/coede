import React, { useState, useEffect, useRef } from "react";
import { 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  FileText, 
  Settings, 
  Play, 
  RefreshCw, 
  Terminal, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  CheckCircle,
  X
} from "lucide-react";
import { Project } from "../types";

interface EditorViewProps {
  activeProject: Project;
  onSaveFiles: (files: Record<string, string>) => void;
}

export default function EditorView({ activeProject, onSaveFiles }: EditorViewProps) {
  // Sync internal state with active project
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("main.js");
  const [openTabs, setOpenTabs] = useState<string[]>(["main.js", "index.html"]);
  
  // Terminal and output states
  const [activeConsoleTab, setActiveConsoleTab] = useState<"problems" | "output" | "debug" | "terminal">("terminal");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [runOutputCode, setRunOutputCode] = useState<string>("");
  const [showBrowserPreview, setShowBrowserPreview] = useState(false);
  const [previewIframeContent, setPreviewIframeContent] = useState<string>("");

  // Folders expanded states
  const [srcExpanded, setSrcExpanded] = useState(true);
  const [assetsExpanded, setAssetsExpanded] = useState(false);

  useEffect(() => {
    if (activeProject && activeProject.files) {
      setFiles({ ...activeProject.files });
      // Identify default file to load
      const availableFiles = Object.keys(activeProject.files);
      if (availableFiles.length > 0) {
        const priority = ["main.js", "main.tsx", "code.rs", "App.tsx", "index.html"];
        const found = priority.find(p => availableFiles.includes(p)) || availableFiles[0];
        setActiveFile(found);
        if (!openTabs.includes(found)) {
          setOpenTabs([...openTabs, found]);
        }
      }
    }
  }, [activeProject]);

  useEffect(() => {
    // Initial cool logger
    setTerminalLogs([
      `user@codearena:~/${activeProject.name.toLowerCase()}$ npm run dev`,
      `> ${activeProject.name.toLowerCase()}@1.0.0 dev`,
      `> vite`,
      "",
      `VITE v4.3.9 ready in 245 ms`,
      "  ➜  Local:   http://localhost:3000/",
      "  ➜  Network: use --host to expose",
      "  ➜  press h to show help"
    ]);
  }, [activeProject]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updated = { ...files, [activeFile]: e.target.value };
    setFiles(updated);
    onSaveFiles(updated);
  };

  const handleSelectFile = (fileName: string) => {
    setActiveFile(fileName);
    if (!openTabs.includes(fileName)) {
      setOpenTabs([...openTabs, fileName]);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabClose: string) => {
    e.stopPropagation();
    const remaining = openTabs.filter(t => t !== tabClose);
    setOpenTabs(remaining);
    if (activeFile === tabClose && remaining.length > 0) {
      setActiveFile(remaining[0]);
    }
  };

  // Compile & run code simulation
  const handleExecuteCode = () => {
    setIsCompiling(true);
    setActiveConsoleTab("output");
    setRunOutputCode("Compilation en cours...\nLancement du conteneur virtuel...");

    setTimeout(() => {
      // Analyze what code says to mock a realistic response
      const code = files[activeFile] || "";
      let outputMocks = "[SUCCESS] Compilation réussie.\n\n=== EXÉCUTION ===\n";
      
      if (activeFile.endsWith(".html") || files["index.html"]) {
        // Prepare HTML live preview simulated content
        const indexHtml = files["index.html"] || "<h3>Aucun fichier index.html</h3>";
        const scriptCode = files["main.js"] || "";
        
        let integrated = indexHtml;
        if (scriptCode) {
          integrated = indexHtml.replace("</body>", `<script>${scriptCode}</script></body>`);
        }
        setPreviewIframeContent(integrated);
        setShowBrowserPreview(true);
      }

      if (code.includes("findPath")) {
        outputMocks += "Appel de la fonction findPath(grid, [0,0], [2,2])...\nRecherche du chemin de [0,0] à [2,2]...\n• Étape 1: [0,0]\n• Étape 2: [0,1]\n• Étape 3: [1,1]\n• Étape 4: [2,2]\nChemin trouvé avec succès en 4 étapes.\n\n[INFO] Test d'algorithme réussi ! Score: 100/100";
      } else if (code.includes("DuelInstance")) {
        outputMocks += "Initialisation du moteur de l'arène...\nArène prête : Labyrinthe Cosmique v2\nConteneur en cours d'exécution...\n[INFO] Le duel simulé est actif.\nStatus: Attente de soumission.";
      } else if (code.includes("function") || code.includes("class")) {
        outputMocks += "Lancement de la fonction...\n" + (code.match(/function\s+(\w+)/)?.[1] || "main") + "() a renvoyé : OK\nExécution terminée avec code 0.";
      } else {
        outputMocks += "Sortie brute :\n----------------------\n" + code.slice(0, 300) + "\n----------------------\nExécution de script terminée.";
      }

      setRunOutputCode(outputMocks);
      setIsCompiling(false);
    }, 1200);
  };

  // Basic syntax coloring logic
  const renderHighlightedCode = (rawText: string) => {
    if (!rawText) return <span className="text-brand-muted font-mono">// Fichier vide</span>;

    // Split text into lines, highlight basic tags
    const lines = rawText.split("\n");
    return lines.map((line, lineIdx) => {
      // Very basic keyword replacements
      const tokens = line.split(/(\s+|,|\.|\(|\)|\{|\}|\[|\]|;|=|\*)/);
      return (
        <div key={lineIdx} className="hover:bg-brand-active/20 font-mono tracking-wide leading-6 min-h-[24px]">
          {tokens.map((token, tokenIdx) => {
            const trimmed = token.trim();
            // Comments
            if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
              return <span key={tokenIdx} className="text-emerald-700/80 italic font-mono">{token}</span>;
            }
            if (trimmed === "class" || trimmed === "function" || trimmed === "import" || trimmed === "from" || trimmed === "const" || trimmed === "let" || trimmed === "var" || trimmed === "return" || trimmed === "async" || trimmed === "await" || trimmed === "new") {
              return <span key={tokenIdx} className="text-brand-muted font-bold font-mono">{token}</span>;
            }
            if (trimmed === "this" || trimmed === "super" || trimmed === "constructor") {
              return <span key={tokenIdx} className="text-[#DAF1DE] font-semibold font-mono">{token}</span>;
            }
            if (/^\d+$/.test(trimmed)) {
              return <span key={tokenIdx} className="text-emerald-400 font-mono">{token}</span>;
            }
            if (trimmed.startsWith("'") && trimmed.endsWith("'") || trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith('`') && trimmed.endsWith('`')) {
              return <span key={tokenIdx} className="text-aquamarine-400 opacity-90 font-mono">{token}</span>;
            }
            return <span key={tokenIdx} className="text-brand-primary/80 font-mono">{token}</span>;
          })}
        </div>
      );
    });
  };

  const lineCount = (files[activeFile] || "").split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="flex-grow flex h-full overflow-hidden font-sans">
      
      {/* File Explorer Sidebar */}
      <aside className="w-56 bg-brand-darkest border-r border-brand-border shrink-0 flex flex-col select-none">
        <div className="h-9 bg-[#04191a] border-b border-brand-border flex items-center px-4 justify-between font-sans text-xs font-semibold uppercase tracking-wider text-brand-muted">
          <span className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Explorateur</span>
          <Settings className="w-3.5 h-3.5 cursor-pointer hover:text-brand-primary" />
        </div>

        <div className="p-3 flex-1 overflow-y-auto font-mono text-xs text-brand-muted">
          {/* src Folder */}
          <div className="mb-2">
            <button 
              onClick={() => setSrcExpanded(!srcExpanded)}
              className="flex items-center gap-1.5 py-1 px-1.5 text-brand-primary hover:bg-brand-active/45 rounded w-full text-left font-semibold cursor-pointer"
            >
              <span className="text-brand-muted">{srcExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
              <span className="text-brand-muted">src/</span>
            </button>
            
            {srcExpanded && (
              <div className="ml-5 border-l border-brand-border/30 pl-2.5 my-1 flex flex-col gap-1">
                {Object.keys(files).filter(f => !f.includes("README") && !f.includes("package") && !f.includes("assets")).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSelectFile(key)}
                    className={`flex items-center gap-2 py-1 px-2 rounded w-full text-left cursor-pointer transition-all ${
                      activeFile === key 
                        ? "bg-brand-active text-brand-primary font-bold border border-brand-border/40" 
                        : "hover:bg-brand-active/20 text-brand-muted hover:text-brand-primary"
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${key.endsWith(".html") ? "text-amber-500" : "text-emerald-400"}`} />
                    <span className="truncate">{key}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* assets Folder */}
          <div className="mb-2">
            <button 
              onClick={() => setAssetsExpanded(!assetsExpanded)}
              className="flex items-center gap-1.5 py-1 px-1.5 text-brand-primary hover:bg-brand-active/45 rounded w-full text-left font-semibold cursor-pointer"
            >
              <span className="text-brand-muted">{assetsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
              <span className="text-brand-muted">assets/</span>
            </button>
            {assetsExpanded && (
              <div className="ml-5 border-l border-brand-border/30 pl-2.5 my-1 flex flex-col gap-1">
                {Object.keys(files).filter(f => f.startsWith("assets") || f.includes("README")).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSelectFile(key)}
                    className={`flex items-center gap-2 py-1 px-2 rounded w-full text-left cursor-pointer transition-all ${
                      activeFile === key 
                        ? "bg-brand-active text-brand-primary font-bold border border-brand-border/40" 
                        : "hover:bg-brand-active/20 text-brand-muted hover:text-brand-primary"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{key.replace(/^assets\//, "")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Root standard project configurations */}
          <div className="mt-4 border-t border-brand-border/30 pt-3 flex flex-col gap-1">
            {Object.keys(files).filter(f => f.includes("package.json") || f.includes("README.md") && !f.startsWith("assets")).map((key) => (
              <button
                key={key}
                onClick={() => handleSelectFile(key)}
                className={`flex items-center gap-2 py-1 px-2 rounded w-full text-left cursor-pointer transition-all ${
                  activeFile === key 
                    ? "bg-brand-active text-brand-primary font-bold border border-brand-border/40" 
                    : "hover:bg-brand-active/20 text-brand-muted hover:text-brand-primary"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-brand-muted" />
                <span className="truncate">{key}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame container */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#061919]">
        
        {/* Monaco Editor Tab bar */}
        <div className="h-9 bg-brand-darkest border-b border-brand-border flex items-center select-none overflow-x-auto scrollbar-none shrink-0">
          <div className="flex">
            {openTabs.map((tab) => {
              const isActive = activeFile === tab;
              return (
                <div
                  key={tab}
                  onClick={() => setActiveFile(tab)}
                  className={`h-9 px-4 flex items-center gap-2 border-r border-brand-border font-mono text-xs cursor-pointer select-none transition-all ${
                    isActive 
                      ? "bg-brand-surface text-brand-primary border-t-2 border-t-brand-primary font-bold" 
                      : "text-brand-muted hover:bg-brand-active/30 hover:text-brand-primary"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab}</span>
                  <button 
                    onClick={(e) => handleCloseTab(e, tab)}
                    className="p-0.5 rounded-full hover:bg-brand-active text-brand-muted/70 hover:text-brand-primary"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Play runner on navigation header */}
          <div className="ml-auto pr-6 flex items-center gap-3">
            <button
              onClick={handleExecuteCode}
              disabled={isCompiling}
              className="bg-brand-primary text-brand-darkest hover:bg-opacity-95 text-[11px] py-1 px-3.5 rounded font-bold cursor-pointer transition-all active:scale-[0.97] flex items-center gap-1.5 shadow-[0_0_8px_rgba(218,241,222,0.2)]"
            >
              {isCompiling ? (
                <RefreshCw className="w-3 h-3 animate-spin text-brand-darkest" />
              ) : (
                <Play className="w-3 h-3 text-brand-darkest fill-brand-darkest" />
              )}
              <span>Démarrer</span>
            </button>
          </div>
        </div>

        {/* Text workspace panel */}
        <div className="flex-grow flex overflow-hidden min-h-0 relative">
          
          {/* Synchronized Line Numbers */}
          <div className="w-10 select-none bg-brand-darkest text-brand-border/40 font-mono text-xs text-right pr-3.5 py-4 leading-6 border-r border-brand-border/10">
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>

          {/* Multi layer editing view (overlapping absolute textarea for true interactiveness) */}
          <div className="flex-1 relative overflow-auto font-mono text-xs p-4 bg-brand-surface/10 leading-6 min-w-0">
            {/* Overlap rendering backdrop for colored highlights */}
            <pre className="absolute inset-0 p-4 pointer-events-none text-transparent whitespace-pre select-none min-w-full">
              {renderHighlightedCode(files[activeFile] || "")}
            </pre>

            {/* Editable layer */}
            <textarea
              value={files[activeFile] || ""}
              onChange={handleTextareaChange}
              spellCheck={false}
              className="absolute inset-0 p-4 bg-transparent border-none text-brand-primary focus:outline-none focus:ring-0 font-mono text-xs leading-6 resize-none w-full h-full whitespace-pre select-text caret-brand-primary"
              style={{ color: "transparent" }}
            />
          </div>

          {/* Browser Frame Simulation Drawer */}
          {showBrowserPreview && (
            <div className="w-[420px] border-l border-brand-border bg-brand-darkest flex flex-col z-10 shrink-0">
              <div className="h-9 bg-brand-surface border-b border-brand-border flex items-center justify-between px-3 select-none">
                <span className="text-xs font-bold font-sans text-brand-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Visualiseur Web
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setShowBrowserPreview(false)}
                    className="text-brand-muted hover:text-brand-primary cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Browser bar layout */}
              <div className="h-8 bg-brand-surface/50 border-b border-brand-border/30 flex items-center px-4 gap-2 select-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-border"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-border"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-border"></div>
                </div>
                <div className="flex-grow bg-brand-darkest/75 border border-brand-border/40 rounded px-2.5 py-0.5 text-[9px] font-mono text-brand-muted truncate">
                  http://localhost:3000/preview
                </div>
              </div>

              {/* Rendered simulated iframe body */}
              <div className="flex-grow p-4 bg-[#0a1e1e]">
                {previewIframeContent ? (
                  <div className="w-full h-full bg-black/40 border border-brand-border/40 rounded-lg p-4 font-mono text-xs text-brand-primary overflow-auto">
                    <p className="text-[10px] text-brand-muted border-b border-brand-border/20 pb-1 mb-2 font-semibold">OUTPUT RENDER :</p>
                    <div dangerouslySetInnerHTML={{ __html: previewIframeContent }} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Sparkles className="w-8 h-8 text-brand-muted mb-3" />
                    <p className="text-xs text-brand-primary font-bold">Aperçu en direct</p>
                    <p className="text-[10px] text-brand-muted mt-1 leading-normal max-w-xs">
                      Exécutez vos fichiers html/css pour générer le rendu simulé du conteneur en direct.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Console & outputs status breadcrumbs footer */}
        <div className="h-6 bg-brand-darkest border-t border-brand-border flex items-center px-4 font-mono text-[10px] text-brand-muted select-none">
          <span>src</span>
          <ChevronRight className="w-3 h-3 mx-1 font-bold" />
          <span>{activeFile}</span>
          <ChevronRight className="w-3 h-3 mx-1 font-bold" />
          <span className="text-brand-primary">{activeFile === "main.js" ? "DuelInstance" : "DOM_AppRoot"}</span>
          
          <div className="ml-auto flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> 0 Erreurs
            </span>
            <span>UTF-8</span>
            <span className="bg-brand-active px-1 rounded pb-0.5">JS / HTML</span>
          </div>
        </div>

        {/* Terminal panel drawer (bottom 240px) */}
        <div className="h-60 bg-brand-surface border-t border-brand-border flex flex-col shrink-0 select-none">
          
          {/* Header tabs toggle items */}
          <div className="h-9 bg-brand-darkest border-b border-brand-border flex items-center px-4 font-sans text-[11px] font-bold uppercase tracking-wider text-brand-muted gap-6 select-none border-t border-brand-border/20">
            <button
              onClick={() => setActiveConsoleTab("problems")}
              className={`pb-1 border-b-2 hover:text-brand-primary tracking-wide transition-all ${
                activeConsoleTab === "problems" ? "border-brand-primary text-brand-primary" : "border-transparent text-brand-muted"
              }`}
            >
              Problèmes
            </button>
            <button
              onClick={() => setActiveConsoleTab("output")}
              className={`pb-1 border-b-2 hover:text-brand-primary tracking-wide transition-all ${
                activeConsoleTab === "output" ? "border-brand-primary text-brand-primary" : "border-transparent text-brand-muted"
              }`}
            >
              Sortie
            </button>
            <button
              onClick={() => setActiveConsoleTab("debug")}
              className={`pb-1 border-b-2 hover:text-brand-primary tracking-wide transition-all ${
                activeConsoleTab === "debug" ? "border-brand-primary text-brand-primary" : "border-transparent text-brand-muted"
              }`}
            >
              Débogeur
            </button>
            <button
              onClick={() => setActiveConsoleTab("terminal")}
              className={`pb-1 border-b-2 hover:text-brand-primary tracking-wide transition-all ${
                activeConsoleTab === "terminal" ? "border-brand-primary text-brand-primary" : "border-transparent text-brand-muted"
              }`}
            >
              Terminal
            </button>

            <div className="ml-auto flex gap-2">
              <button 
                onClick={() => setTerminalLogs([])}
                className="hover:text-brand-primary transition-colors"
                title="Vider terminal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive display fields based on active console tab */}
          <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#061919]/60">
            {activeConsoleTab === "problems" && (
              <div className="flex flex-col gap-2">
                <p className="text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Analyse statique : Aucun problème détecté dans les fichiers édités.
                </p>
                <span className="text-[10px] text-brand-muted font-medium">ESLint v8.42 local ruleset loaded.</span>
              </div>
            )}

            {activeConsoleTab === "output" && (
              <pre className="text-brand-primary/95 font-mono whitespace-pre text-xs h-full overflow-y-auto">
                {runOutputCode || "Appuyez sur 'Démarrer' en haut pour compiler et exécuter le code de l'éditeur."}
              </pre>
            )}

            {activeConsoleTab === "debug" && (
              <div className="text-brand-muted/90 flex flex-col gap-1">
                <p className="text-brand-primary font-bold">Console de débogage CodeArena chargée.</p>
                <p className="text-brand-muted">Moteur d'écoute réactif connecté au port : 3000</p>
                <p className="text-[10px] text-brand-muted mt-2 opacity-60">Prêt à intercepter les traces du code...</p>
              </div>
            )}

            {activeConsoleTab === "terminal" && (
              <div className="font-mono text-[11px] text-brand-muted/95 flex flex-col gap-1 pb-4 h-full">
                {terminalLogs.map((log, idx) => (
                  <p key={idx} className={`${log.startsWith("user@") ? "text-brand-primary font-bold" : ""}`}>
                    {log}
                  </p>
                ))}
                <div className="flex items-center gap-1 font-mono text-[11px] text-brand-primary mt-2">
                  <span>user@codearena:~/{activeProject.name.toLowerCase()}$</span>
                  <span className="w-2 h-4 bg-brand-primary text-brand-primary select-none animate-pulse"></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
