import React, { useState, useEffect } from "react";
import { FileState } from "../types";
import { Info, Code, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

interface MergeConflictEditorProps {
  conflictFile: FileState;
  onResolve: (filepath: string, resolvedContent: string) => void;
  isLightTheme?: boolean;
}

export default function MergeConflictEditor({
  conflictFile,
  onResolve,
  isLightTheme = false
}: MergeConflictEditorProps) {
  const oursCode = conflictFile.conflict?.ours || "";
  const theirsCode = conflictFile.conflict?.theirs || "";

  // The custom editable result code
  const [resultCode, setResultCode] = useState("");

  // Populate initially with standard Git Conflict Markers for ultimate reality!
  useEffect(() => {
    const defaultMerge = `<<<<<<< HEAD (Ours)
${oursCode}
=======
${theirsCode}
>>>>>>> Incoming (Theirs)`;
    setResultCode(conflictFile.conflict?.result || defaultMerge);
  }, [conflictFile, oursCode, theirsCode]);

  const handleUseOurs = () => {
    setResultCode(oursCode);
  };

  const handleUseTheirs = () => {
    setResultCode(theirsCode);
  };

  const handleUseBoth = () => {
    setResultCode(`${oursCode}\n\n${theirsCode}`);
  };

  const handleSave = () => {
    onResolve(conflictFile.filepath, resultCode);
  };

  return (
    <div className={`p-5 rounded-2xl border ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"} shadow-xl flex flex-col space-y-5 h-full`}>
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-950/60 border border-rose-900/40 text-rose-400 text-[10px] font-mono rounded-full uppercase tracking-wider font-semibold">
            Conflito Ativo
          </div>
          <h3 className="font-display font-bold text-base text-white">
            Editor de Conflitos de Mesclagem
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            arquivo: <span className="text-rose-400 font-medium">{conflictFile.filepath}</span>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer self-start sm:self-center"
        >
          <CheckCircle2 className="h-4 w-4" /> Finalizar Resolução
        </button>
      </div>

      {/* Two Panes (Ours vs Theirs) side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ours Pane */}
        <div className="bg-slate-950 border border-indigo-950 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-indigo-950/40 px-3 py-2 border-b border-indigo-900 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-400">
              HEAD (Nossas Alterações)
            </span>
            <button
              onClick={handleUseOurs}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded transition cursor-pointer"
            >
              Aceitar Nossas
            </button>
          </div>
          <pre className="p-4 overflow-auto max-h-32 text-[11px] font-mono text-slate-300 leading-normal scrollbar-thin">
            {oursCode}
          </pre>
        </div>

        {/* Theirs Pane */}
        <div className="bg-slate-950 border border-purple-950 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-purple-950/40 px-3 py-2 border-b border-purple-900 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-400">
              Incoming (Alterações Entrando)
            </span>
            <button
              onClick={handleUseTheirs}
              className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded transition cursor-pointer"
            >
              Aceitar Entrando
            </button>
          </div>
          <pre className="p-4 overflow-auto max-h-32 text-[11px] font-mono text-slate-300 leading-normal scrollbar-thin">
            {theirsCode}
          </pre>
        </div>
      </div>

      {/* Helper trigger controls */}
      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>Quer combinar as duas alterações de forma automática?</span>
        </div>
        <button
          onClick={handleUseBoth}
          className="text-indigo-400 hover:text-indigo-300 font-bold underline transition"
        >
          Manter Ambas no Código
        </button>
      </div>

      {/* Editor Output Pane */}
      <div className="space-y-2 flex-1 flex flex-col">
        <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold block">
          Visualização do Resultado Final (Edite livremente se desejar)
        </label>
        <div className="relative flex-1 flex flex-col min-h-48 border border-slate-800 rounded-xl overflow-hidden bg-[#03060f]">
          <textarea
            value={resultCode}
            onChange={(e) => setResultCode(e.target.value)}
            className="flex-1 w-full p-4 bg-transparent text-xs font-mono text-slate-200 outline-none resize-none leading-relaxed focus:ring-0 select-text"
            placeholder="Edite aqui o resultado final do código do conflito"
          />
        </div>
      </div>
    </div>
  );
}
