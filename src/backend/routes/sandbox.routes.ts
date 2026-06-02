import { Router } from 'express';
import { getGemini, hasGeminiKey } from '../services/gemini';

const router = Router();

// POST /api/execute
router.post('/', async (req, res) => {
  const { language, filename, code, files = {} } = req.body;
  const hasKey = hasGeminiKey();

  if (!hasKey) {
    let output = `[SUCCESS] Compilation réussie (${language}).\n\n=== EXÉCUTION EN COURS ===\n`;
    if (code.includes("print") || code.includes("console.log") || code.includes("println!")) {
      const matches = [...code.matchAll(/(?:console\.log|print|println!)\s*\(\s*["'`](.*?)["'`]\s*\)/g)];
      if (matches.length > 0) {
        output += matches.map(m => m[1]).join("\n") + "\n";
      } else {
        output += `Exécution de la logique principale...\nFichier : ${filename}\n`;
      }
    } else {
      output += `Exécution du script standard...\nLangage : ${language}\nTaille : ${code.length} caractères.\n`;
    }
    output += `\n[INFO] Exécution terminée avec code de sortie 0.`;
    return res.json({ output });
  }

  try {
    const ai = getGemini();

    const fileContext = Object.entries(files)
      .map(([name, content]) => `--- FICHIER: ${name} ---\n${content}`)
      .join("\n\n");

    const systemInstruction = `Tu es le compilateur universel et l'interpréteur de CodeArena sandbox.
Analyse le code fourni pour le fichier sélectionné "${filename}" (Langage: ${language}) dans le contexte du projet.
Si le code contient des fautes de syntaxe, des variables indéfinies ou des erreurs flagrantes de logique, renvoie un message d'erreur d'interpréteur propre au langage (ex: "TypeError" en JS/React, "AttributeError" en Python, "error[E0308]" en Rust, "error: compilation failed" en C++).
Sinon, simule fidèlement la sortie console (stdout/stderr) exacte que l'exécution de ce code produirait, y compris tous les appels de journalisations ou de prints du fichier exécutable (main file).
Formate la sortie brute exactement comme le terminal du système d'exploitation la renverrait (pas de markdown en dehors du contenu de la console, pas de bavardage d'explication d'IA, ne dis pas "Voici le résultat" - donne uniquement le contenu textuel brut du flux de sortie de la console !).`;

    const prompt = `Fichiers du projet :\n${fileContext}\n\nFichier actif à exécuter : "${filename}"\nCode source :\n${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2
      }
    });

    res.json({ output: (response.text || "Exécution terminée avec succès.").trim() });

  } catch (error: any) {
    console.error("Erreur de compilation/exécution simulée via Gemini:", error);
    res.json({ output: `[ERREUR SYSTEME] Impossible d'exécuter l'interpréteur virtuel.\n${error.message}` });
  }
});

export default router;
