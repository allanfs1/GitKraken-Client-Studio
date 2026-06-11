import React, { useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Code, 
  HelpCircle, 
  ChevronRight, 
  GitCommit, 
  User, 
  AlertTriangle 
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface GitKrakenGitLensProps {
  isLightTheme: boolean;
  gitLensActiveFile: string;
  setGitLensActiveFile: (s: string) => void;
  gitLensExplanation: string;
  setGitLensExplanation: (s: string) => void;
  gitLensExplaining: boolean;
  setGitLensExplaining: (b: boolean) => void;
}

// Predefined virtual files with codes to make the analysis incredibly real!
const VIRTUAL_CODES: Record<string, { code: string; blame: string[]; author: string[]; date: string[] }> = {
  "src/components/Checkout.tsx": {
    code: `import React, { useState } from "react";\nimport { loadStripe } from "@stripe/stripe-js";\n\nexport const Checkout: React.FC = () => {\n  const [loading, setLoading] = useState(false);\n  const [cartCount, setCartCount] = useState(1);\n\n  const handlePurchase = async () => {\n    setLoading(true);\n    console.log("Iniciando fluxo de cobrança...");\n    // TODO: Adicionar tratamento de erros e conexões seguras CORS\n    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_KEY);\n    if (stripe) {\n      stripe.redirectToCheckout({\n        sessionId: "session_mock_123"\n      });\n    }\n    setLoading(false);\n  };\n\n  return (\n    <div className="p-4 border rounded-xl">\n      <h4>Carrinho de Compras ({cartCount})</h4>\n      <button onClick={handlePurchase} disabled={loading}>\n        {loading ? "Processando..." : "Comprar via Stripe"}\n      </button>\n    </div>\n  );\n};`,
    blame: [
      "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Bob (UX)", "Alice (Lead)", "Carol (Dev)", "Carol (Dev)",
      "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)",
      "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Carol (Dev)", "Bob (UX)", "Bob (UX)",
      "Bob (UX)", "Bob (UX)", "Bob (UX)", "Bob (UX)", "Bob (UX)", "Bob (UX)", "Bob (UX)"
    ],
    author: ["Carol (Dev)", "Bob (UX)", "Alice (Lead)"],
    date: ["4 dias atrás", "2 dias atrás", "1 semana atrás"]
  },
  "package.json": {
    code: `{\n  "name": "kraken-workspace-project",\n  "version": "1.0.0",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "lint": "eslint . --ext ts,tsx"\n  },\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1",\n    "lucide-react": "^0.450.0",\n    "motion": "^12.0.0"\n  },\n  "devDependencies": {\n    "@types/react": "^18.3.5",\n    "typescript": "^5.5.4",\n    "vite": "^6.0.0"\n  }\n}`,
    blame: [
      "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)",
      "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Carol (Dev)",
      "Bob (UX)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)"
    ],
    author: ["Alice (Lead)", "Carol (Dev)"],
    date: ["3 semanas atrás", "1 semana atrás"]
  },
  "server.ts": {
    code: `import express from "express";\nimport path from "path";\nimport { GoogleGenAI } from "@google/genai";\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\n// Middleware configurando CORS para o frontend\napp.use((req, res, next) => {\n  res.header("Access-Control-Allow-Origin", "*");\n  res.header("Access-Control-Allow-Headers", "Content-Type");\n  next();\n});\n\napp.post("/api/metrics", (req, res) => {\n  res.json({ cpu: "24%", memory: "128MB" });\n});\n\napp.listen(PORT, "0.0.0.0", () => {\n  console.log("Servidor carregado com sucesso.");\n});`,
    blame: [
      "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)",
      "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)",
      "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)", "Alice (Lead)"
    ],
    author: ["Alice (Lead)"],
    date: ["2 semanas atrás"]
  }
};

const GitKrakenGitLens: React.FC<GitKrakenGitLensProps> = ({
  isLightTheme,
  gitLensActiveFile,
  setGitLensActiveFile,
  gitLensExplanation,
  setGitLensExplanation,
  gitLensExplaining,
  setGitLensExplaining
}) => {
  const [selectedLines, setSelectedLines] = useState<string>("Todas as linhas");

  const activeFileData = VIRTUAL_CODES[gitLensActiveFile] || VIRTUAL_CODES["src/components/Checkout.tsx"];

  const handleRequestExplain = async () => {
    setGitLensExplaining(true);
    setGitLensExplanation("");

    try {
      const response = await fetch("/api/gemini/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filepath: gitLensActiveFile,
          code: activeFileData.code,
          selectedLines: selectedLines
        })
      });

      const data = await response.json();
      setGitLensExplanation(data.explanation || "Nenhum feedback foi obtido.");
    } catch (err: any) {
      console.error(err);
      setGitLensExplanation(`Erro de comunicação com o servidor AI: ${err.message || err}`);
    } finally {
      setGitLensExplaining(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-stretch select-none">
      
      {/* Left Columns: Virtual File list & AI Lens Controls */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        
        {/* Core GitLens panel header */}
        <div className={`p-5 rounded-2xl border ${isLightTheme ? "bg-white border-slate-201" : "bg-slate-900 border-slate-850"}`}>
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800/60 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-xs uppercase font-mono tracking-widest font-bold text-slate-300">GitLens Pro • Lentes de IA</h3>
              <p className="text-[10px] text-slate-500 font-light">Selecione arquivos críticos para fazer blame, rastrear e analisar código com IA.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block mb-2">Selecione Arquivo do Workspace</span>
              <div className="space-y-1.5">
                {Object.keys(VIRTUAL_CODES).map(filename => {
                  const isActive = filename === gitLensActiveFile;
                  return (
                    <div
                      key={filename}
                      onClick={() => {
                        setGitLensActiveFile(filename);
                        setGitLensExplanation("");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                        isActive 
                          ? "bg-indigo-950/30 border-indigo-500 text-indigo-400 font-semibold" 
                          : isLightTheme ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-slate-950/60 border-transparent hover:border-slate-850 hover:bg-slate-900 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Code className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span className="truncate">{filename}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Control Trigger Block */}
            <div className="pt-3.5 border-t border-slate-800/60 space-y-3">
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Escopo da Análise</span>
              <select
                value={selectedLines}
                onChange={(e) => setSelectedLines(e.target.value)}
                className={`w-full text-xs p-2 rounded-lg border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-850 text-slate-200"}`}
              >
                <option value="Todas as linhas">Tudo (Código Completo)</option>
                <option value="Linhas 1-15">Linhas 1-15 (Declarações & Estados)</option>
                <option value="Linhas 10-25">Linhas 10-25 (Funções do Gateway)</option>
                <option value="Linhas 20-30">Linhas 20-30 (Elementos UI de Retorno)</option>
              </select>

              <button
                onClick={handleRequestExplain}
                disabled={gitLensExplaining}
                className="w-full bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-indigo-600/20"
              >
                {gitLensExplaining ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Lendo Linhas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span>Explicar Código com IA</span>
                  </>
                )}
              </button>
            </div>

            {/* Static Stats Card */}
            <div className={`p-4 rounded-xl border flex flex-col space-y-2 select-none text-[11px] ${isLightTheme ? "bg-slate-100 border-slate-200 text-slate-650" : "bg-[#0b0f19] border-slate-850/80 text-slate-400"}`}>
              <span className="text-[8.5px] uppercase font-mono tracking-wider font-bold text-slate-550 block mb-0.5">Métricas de Blame do Arquivo</span>
              <div className="flex justify-between">
                <span>Modificadores Ativos:</span>
                <span className="font-semibold text-slate-203">{activeFileData.author.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Modificações Pendentes:</span>
                <span className="text-amber-500 font-bold">1 Modificação</span>
              </div>
              <div className="flex justify-between">
                <span>Complexidade Cognitiva:</span>
                <span className="text-emerald-450 font-bold">Baixa (Apto para Staging)</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Right Column: Code viewer & Blames and AI Explanation Output */}
      <div className="lg:col-span-8 flex flex-col space-y-5">
        <div className={`p-5 rounded-2xl border flex flex-col space-y-4 h-full ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-[400px] items-stretch">
            
            {/* Visual Code Editor Panel (Col 7) */}
            <div className="md:col-span-7 flex flex-col space-y-2">
              <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#a8a19b] font-bold block mb-1">Inspecionar de Código Ativo ({gitLensActiveFile})</span>
              
              <div className="flex-1 flex overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-[10.5px] leading-relaxed relative">
                
                {/* Line Numbers column */}
                <div className="bg-[#0c0f18] text-slate-700 px-3 py-3 border-r border-slate-900 text-right select-none">
                  {activeFileData.code.split("\n").map((_, idx) => (
                    <div key={idx} className="h-5">{idx + 1}</div>
                  ))}
                </div>

                {/* Code body line by line */}
                <div className="flex-1 overflow-x-auto py-3 px-4 text-slate-300 relative h-full">
                  {activeFileData.code.split("\n").map((line, idx) => {
                    const authorForLine = activeFileData.blame[idx] || "Alice (Lead)";
                    return (
                      <div key={idx} className="h-5 group flex items-center justify-between hover:bg-indigo-950/20 px-1 rounded">
                        <span className="truncate pr-4">{line || " "}</span>
                        {/* Hover blame line marker */}
                        <span className="hidden group-hover:inline text-[9px] text-slate-600 bg-slate-900 leading-none py-0.5 px-1.5 rounded-md border border-slate-800 scale-95 uppercase font-medium">
                          {authorForLine}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Explanation Result Drawer Panel (Col 5) */}
            <div className="md:col-span-5 flex flex-col space-y-2">
              <span className="text-[9.5px] uppercase font-mono tracking-widest text-indigo-400 font-bold block mb-1">Feedback e Blame AI Integrados</span>
              
              <div className={`flex-1 rounded-xl p-4 overflow-y-auto ${isLightTheme ? "bg-slate-100 border border-slate-200 text-slate-800" : "bg-[#0b0e17] border border-slate-850 text-slate-300"} relative`}>
                {gitLensExplaining ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2 text-center py-12">
                    <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Calculando Lógica...</span>
                    <p className="text-[10px] text-slate-600 max-w-xs font-light">Consumindo chaves .env seguras para consultar o modelo Gemini 3.5 Flash e estruturar relatórios estáticos de code review...</p>
                  </div>
                ) : gitLensExplanation ? (
                  <div className="prose prose-invert text-[11.5px] leading-relaxed max-w-none">
                    <ReactMarkdown>{gitLensExplanation}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-600 space-y-1.5 select-none">
                    <HelpCircle className="h-6 w-6 text-slate-700 animate-bounce" />
                    <span className="text-[11px] font-semibold text-slate-400 block">Nenhum feedback carregado</span>
                    <p className="text-[10px] max-w-xs leading-relaxed font-light">Selecione o arquivo do checkout ou do servidor na barra esquerda e clique em "Explicar Código com IA".</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default GitKrakenGitLens;
