import React, { useState, useRef, useEffect } from "react";
import { Terminal, ChevronRight, Activity, CornerDownLeft } from "lucide-react";

interface TerminalViewProps {
  logs: string[];
  onCommand: (command: string) => void;
  availableBranches: string[];
  activeBranch: string;
  isLightTheme?: boolean;
}

export default function TerminalView({
  logs,
  onCommand,
  availableBranches,
  activeBranch,
  isLightTheme = false
}: TerminalViewProps) {
  const [inputVal, setInputVal] = useState("");
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [showSuggests, setShowSuggests] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Command set with descriptions for our auto-suggest bar!
  const commandsList = [
    { cmd: "git status", desc: "Ver arquivo por arquivo do index staging e modificações" },
    { cmd: "git add .", desc: "Adicionar (stage) todos os arquivos modificados para commit" },
    { cmd: "git commit -m \"", desc: "Criar commit com uma mensagem rápida do terminal" },
    { cmd: "git branch ", desc: "Listar ou criar uma nova ramificação na árvore" },
    { cmd: "git checkout ", desc: "Alterar foco para outra branch ativa (ex: main, feature)" },
    { cmd: "git merge ", desc: "Mesclar ramificações (pode causar conflito interativo)" },
    { cmd: "git reset --hard ", desc: "Voltar para um commit específico descartando alterações" },
    { cmd: "git reset --soft ", desc: "Voltar para um commit específico salvando as alterações na staging area" },
    { cmd: "git push", desc: "Enviar commits locais da branch ativa para o servidor remoto" },
    { cmd: "git pull", desc: "Coletar e atualizar commits locais da ramificação downstream" },
    { cmd: "git stash", desc: "Guardar modificações temporárias em rascunho seguro" },
    { cmd: "git stash pop", desc: "Recuperar e aplicar últimas modificações do rascunho" },
    { cmd: "git log --oneline", desc: "Imprimir histórico curto cronológico de commits" },
    { cmd: "git shortlog -sn", desc: "Ver contribuição (número de commits) de cada membro da equipe" },
    { cmd: "git team", desc: "Listar membros ativos, desenvolvedores e papéis no projeto" },
    { cmd: "help", desc: "Exibir o guia interativo de todos os comandos CLI" },
    { cmd: "clear", desc: "Limpar o histórico de exibição do console atual" }
  ];

  // Filter suggestions
  const suggestions = commandsList.filter((item) => {
    if (!inputVal) return false;
    return item.cmd.toLowerCase().startsWith(inputVal.toLowerCase()) && item.cmd !== inputVal;
  });

  // Watch input value to toggle suggest pop-up
  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggests(true);
    } else {
      setShowSuggests(false);
    }
  }, [inputVal]);

  // Command submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    onCommand(inputVal.trim());
    setInputVal("");
    setShowSuggests(false);
  };

  // Click suggest autocomplete
  const selectSuggestion = (cmd: string) => {
    setInputVal(cmd);
    setSuggestIndex(0);
    setShowSuggests(false);
  };

  // Auto-scroll inside console box
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className={`mt-5 border rounded-2xl overflow-hidden flex flex-col shadow-2xl relative ${isLightTheme ? "bg-slate-900 border-slate-300 text-slate-100" : "bg-[#02050f] border-slate-800 text-slate-200"}`}>
      {/* Console Head */}
      <div className={`px-4 py-2.5 border-b border-slate-950 flex items-center justify-between select-none ${isLightTheme ? "bg-slate-800" : "bg-slate-900/60"}`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-widest">
            Console Git Kraken CLI Integrado
          </span>
        </div>
        <div className="bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-bold uppercase">
          <span className="animate-pulse bg-indigo-500 h-1.5 w-1.5 rounded-full"></span>
          {activeBranch}
        </div>
      </div>

      {/* Terminal log logs container */}
      <div className="p-4 h-48 overflow-y-auto font-mono text-xs text-slate-300 leading-normal bg-[#01040a] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800/80">
        {logs.map((log, idx) => {
          let textStyle = "text-slate-300";
          if (log.startsWith("$")) textStyle = "text-indigo-400 font-bold";
          else if (log.toLowerCase().includes("erro") || log.toLowerCase().includes("failed")) textStyle = "text-rose-450 text-rose-300 font-medium";
          else if (log.toLowerCase().includes("success") || log.toLowerCase().includes("sucesso")) textStyle = "text-emerald-450 text-emerald-400 font-medium";
          else if (log.toLowerCase().includes("commit") || log.toLowerCase().includes("atividades")) textStyle = "text-sky-400";

          return (
            <div key={idx} className={`leading-relaxed break-all ${textStyle}`}>
              {log}
            </div>
          );
        })}
        <div ref={consoleEndRef} />
      </div>

      {/* Suggest Box Float */}
      {showSuggests && (
        <div className="absolute bottom-[44px] left-4 right-4 z-40 max-h-32 bg-slate-900/95 backdrop-blur border border-indigo-900 rounded-xl shadow-xl overflow-y-auto divide-y divide-slate-800/50 p-1">
          {suggestions.map((item, index) => (
            <div
              key={item.cmd}
              onClick={() => selectSuggestion(item.cmd)}
              className="px-3 py-2 flex items-center justify-between text-xs font-mono cursor-pointer hover:bg-slate-950/60 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px]">
                <ChevronRight className="h-3 w-3" />
                {item.cmd}
              </div>
              <span className="text-[10px] text-slate-500 font-sans italic">{item.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Command Shortcuts Toolbar */}
      <div className={`px-4 py-2 flex flex-wrap gap-1.5 items-center justify-start border-t border-b overflow-x-auto ${isLightTheme ? "bg-slate-50 border-slate-205" : "bg-[#050814]/90 border-slate-950"} select-none`}>
        <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest mr-1.5 shrink-0">
          Atalhos Básicos & Avançados:
        </span>
        {[
          "git status",
          "git diff",
          "git log --oneline",
          "git shortlog -sn",
          "git team",
          "git reflog",
          "git tag",
          "git config",
          "git fetch",
          "git clean -fd",
        ].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => onCommand(cmd)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all duration-150 cursor-pointer ${
              isLightTheme
                ? "bg-white hover:bg-indigo-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
                : "bg-slate-950/80 hover:bg-indigo-950/75 border-slate-900 text-slate-400 hover:text-indigo-400 hover:border-indigo-900/60"
            }`}
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Command prompt form box */}
      <form onSubmit={handleSubmit} className="flex border-t border-slate-950 bg-[#02050f]/60 pr-3 items-center">
        <label className="pl-3.5 pr-2 py-2 flex text-indigo-400 select-none">
          <Terminal className="h-4 w-4 shrink-0" />
        </label>
        <span className="text-slate-500 font-mono text-xs pr-1 select-none">git-kraken:~$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Digite um comando (ex: git checkout main)...`}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-200 font-mono py-2.5 px-1.5 focus:ring-0 focus:outline-none placeholder:text-slate-700 placeholder:italic select-text"
        />
        <button
          type="submit"
          className="p-1 px-2.5 bg-indigo-950 border border-indigo-900 text-indigo-400 hover:text-white rounded-lg hover:bg-indigo-900 transition flex items-center gap-1 cursor-pointer font-sans text-[10px] font-bold"
        >
          Executar <CornerDownLeft className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
