import React, { useState } from "react";
import { 
  Layers, 
  Plus, 
  Folder, 
  Terminal, 
  Info, 
  BarChart, 
  RefreshCw, 
  TrendingUp, 
  GitBranch, 
  Trash2,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";

interface Worktree {
  id: string;
  name: string;
  path: string;
  branch: string;
  isActive: boolean;
}

interface GitRepository {
  id: string;
  name: string;
  description: string;
  activeBranch: string;
  branches: string[];
  commits: any[];
}

interface GitKrakenWorktreesProps {
  isLightTheme: boolean;
  worktrees: Worktree[];
  setWorktrees: React.Dispatch<React.SetStateAction<Worktree[]>>;
  newWorktreeBranch: string;
  setNewWorktreeBranch: (s: string) => void;
  newWorktreePath: string;
  setNewWorktreePath: (s: string) => void;
  activeSimRepo: GitRepository;
  setRepositories: any;
  selectedRepoIdSim: string;
  addTerminalLine: (s: string) => void;
}

const GitKrakenWorktrees: React.FC<GitKrakenWorktreesProps> = ({
  isLightTheme,
  worktrees,
  setWorktrees,
  newWorktreeBranch,
  setNewWorktreeBranch,
  newWorktreePath,
  setNewWorktreePath,
  activeSimRepo,
  setRepositories,
  selectedRepoIdSim,
  addTerminalLine
}) => {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const handleAddWorktree = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAlert(null);
    if (!newWorktreePath.trim()) return;

    // Check if branch already used in worktree
    const duplicateBranch = worktrees.find(wt => wt.branch === newWorktreeBranch);
    if (duplicateBranch) {
      setErrorAlert(`A ramificação '${newWorktreeBranch}' já está reservada por outro worktree ativo.`);
      return;
    }

    const newWt: Worktree = {
      id: "wt-" + (worktrees.length + 1),
      name: newWorktreePath.trim().split("/").pop() || "feature-wt",
      path: newWorktreePath.trim(),
      branch: newWorktreeBranch,
      isActive: false
    };

    setWorktrees(prev => [...prev, newWt]);
    setNewWorktreePath(`./worktrees/${activeSimRepo.branches[0] || "feature-branch"}`);
    setIsOpenForm(false);

    addTerminalLine(`>>> git worktree add ${newWt.path} ${newWt.branch}`);
    addTerminalLine(`[Worktree Added] Novo diretório de acompanhamento configurado no caminho: ${newWt.path}`);
  };

  const handleActivateWorktree = (wtId: string) => {
    const targetWt = worktrees.find(wt => wt.id === wtId);
    if (!targetWt) return;

    setWorktrees(prev => prev.map(wt => ({
      ...wt,
      isActive: wt.id === wtId
    })));

    addTerminalLine(`>>> cd ${targetWt.path}`);
    addTerminalLine(`[Directory Changed] Contexto de terminal virtual alterado para: ${targetWt.path} (Head na branch: ${targetWt.branch})`);

    // Switch branch in the Git Simulator dynamically!
    setRepositories((prev: any) =>
      prev.map((r: any) => {
        if (r.id !== selectedRepoIdSim) return r;
        return {
          ...r,
          activeBranch: targetWt.branch
        };
      })
    );
  };

  const handlePruneWorktrees = () => {
    setWorktrees(prev => prev.filter(wt => wt.path === "./" || wt.isActive));
    addTerminalLine(">>> git worktree prune");
    addTerminalLine("[Worktrees Pruned] Removidos diretórios redundantes ou inativos da cache do git.");
  };

  // Stats / Insights calculations to give real value!
  const totalCommitsCount = activeSimRepo.commits.length;
  const rawAuthors = activeSimRepo.commits.map(c => c.author);
  const uniqueAuthorsCount = Array.from(new Set(rawAuthors)).length;
  const branchesCount = activeSimRepo.branches.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-stretch select-none">
      
      {/* Left Column: Worktrees Manager & Forms */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        
        {/* Header toolbar */}
        <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${isLightTheme ? "bg-white border-slate-201" : "bg-slate-900 border-slate-850"}`}>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-xs uppercase font-mono tracking-widest font-bold text-slate-300">Painel de Múltiplos Worktrees</h3>
              <p className="text-[10px] text-slate-500 font-light">Tenha branches diferentes descompactadas em pastas isoladas simultaneamente.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePruneWorktrees}
              title="Executa limpeza estática de pastas órfãs"
              className="p-1 px-2.5 text-[10px] hover:text-rose-400 bg-slate-950/45 border border-slate-800 rounded transition cursor-pointer font-mono"
            >
              Prune
            </button>
            <button
              onClick={() => setIsOpenForm(!isOpenForm)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/60 px-2.5 py-1.5 rounded-lg transition"
            >
              <Plus className="h-3.5 w-3.5" /> {isOpenForm ? "Fechar" : "Novo Worktree"}
            </button>
          </div>
        </div>

        {isOpenForm && (
          <form onSubmit={handleAddWorktree} className={`p-5 rounded-2xl border space-y-3.5 ${isLightTheme ? "bg-white border-slate-200" : "bg-[#0d121c] border-slate-800"}`}>
            <h4 className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-bold">Comando Virtual: git worktree add</h4>
            
            {errorAlert && (
              <div className="p-3 rounded-xl border border-rose-800 bg-rose-950/45 text-rose-350 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block uppercase font-mono text-[9px] tracking-wider text-rose-400">Bloqueio de Concorrência</span>
                  <span>{errorAlert}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setErrorAlert(null)}
                  className="text-slate-500 hover:text-white text-[10px] pr-1"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-35">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Caminho da Pasta de Destino</label>
                <input
                  type="text"
                  required
                  value={newWorktreePath}
                  onChange={(e) => setNewWorktreePath(e.target.value)}
                  placeholder="ex: ./worktrees/feature-checkout"
                  className={`w-full text-xs px-3 py-2 rounded-xl outline-none border ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-850" : "bg-slate-950 border-slate-850 text-slate-200"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Vincular à Branch</label>
                <select
                  value={newWorktreeBranch}
                  onChange={(e) => setNewWorktreeBranch(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-850 text-slate-200"}`}
                >
                  {activeSimRepo.branches.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold py-2 px-4 rounded-xl transition font-mono"
            >
              Montar Novo Diretório de Trabalho
            </button>
          </form>
        )}

        {/* Directory Worktrees list */}
        <div className="space-y-2">
          {worktrees.map(wt => {
            const isMain = wt.path === "./";
            return (
              <div
                key={wt.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  wt.isActive 
                    ? "bg-indigo-950/20 border-indigo-500" 
                    : isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Folder className={`h-5 w-5 mt-1 shrink-0 ${wt.isActive ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
                  <div>
                    <h4 className="text-xs font-bold leading-none text-slate-101 flex items-center gap-1.5">
                      {wt.name} 
                      {wt.isActive && (
                        <span className="text-[8.5px] uppercase font-mono tracking-wider font-bold bg-indigo-900 border border-indigo-800 text-indigo-400 px-1.5 py-0.2 rounded">Head Ativo</span>
                      )}
                    </h4>
                    <span className="text-[10.5px] font-mono text-slate-500 block mt-1">Caminho: {wt.path}</span>
                    <span className="text-[10.5px] font-mono font-medium text-slate-400 mt-0.5 block flex items-center gap-1">
                      <GitBranch className="h-3 w-3 text-slate-600" /> Branch: {wt.branch}
                    </span>
                  </div>
                </div>

                {!wt.isActive && (
                  <button
                    onClick={() => handleActivateWorktree(wt.id)}
                    className="self-end md:self-center font-mono text-[10px] uppercase font-bold tracking-wide text-indigo-400 hover:text-white bg-indigo-950/45 border border-indigo-900/40 p-1.5 px-3 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Ativar Pasta (cd)
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: Insights & Git Documentation details */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* Repo Statistics Bento view */}
        <div className={`p-5 rounded-2xl border flex flex-col space-y-3.5 ${isLightTheme ? "bg-white border-slate-201 text-slate-700" : "bg-slate-900 border-slate-850"}`}>
          <h4 className="text-xs uppercase font-mono tracking-widest text-[#a8a19b] font-bold block flex items-center gap-1">
            <BarChart className="h-4 w-4 text-indigo-400" /> Insights de Projeto & Complexidade
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/60 font-mono text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Volume de Commits</span>
              <span className="text-lg font-bold text-slate-101">{totalCommitsCount}</span>
            </div>
            <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/60 font-mono text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Contribuidores Ativos</span>
              <span className="text-lg font-bold text-[#f59e0b]">{uniqueAuthorsCount}</span>
            </div>
            <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/60 font-mono text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Ramificações Ativas</span>
              <span className="text-lg font-bold text-slate-100">{branchesCount}</span>
            </div>
            <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850/60 font-mono text-center space-y-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Taxa de Conflitos</span>
              <span className="text-lg font-bold text-rose-500">Mínima (2%)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 text-[10.5px] leading-relaxed text-slate-400 font-light space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <TrendingUp className="h-4 w-4 text-emerald-450 shrink-0" />
              <span>Análise de Desempenho Virtual</span>
            </div>
            <p>O desenvolvimento da árvore indica uma progressão saudável. A criação de worktrees reduz drasticamente o tempo desperdiçado em limpezas de stashes periódicas e builds redundantes de node_modules.</p>
          </div>
        </div>

        {/* Git Worktree Cheat Sheet reference educative card */}
        <div className={`p-4 rounded-xl border flex flex-col space-y-2 select-none text-[10.5px] ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#0b0e14]/50 border-slate-850 text-slate-500"}`}>
          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-400 uppercase tracking-wider text-[9px] mb-1">
            <Terminal className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Cola de Comandos: Git Worktree
          </div>
          <div className="space-y-1.5">
            <div>
              <code className="text-indigo-400 font-semibold font-mono font-bold block">git worktree add &lt;caminho&gt; &lt;branch&gt;</code>
              <p className="text-[9.5px] pl-2 font-light">Gera uma nova pasta contendo a cópia clonada do git e ativa a branch correspondente nela.</p>
            </div>
            <div>
              <code className="text-indigo-400 font-semibold font-mono font-bold block">git worktree list</code>
              <p className="text-[9.5px] pl-2 font-light">Exibe todas as pastas de worktree ativas e suas respectivas ramificações em execução.</p>
            </div>
            <div>
              <code className="text-indigo-400 font-semibold font-mono font-bold block">git worktree prune</code>
              <p className="text-[9.5px] pl-2 font-light">Limpa cache e referências de diretórios de trabalho excluídos ou renomeados no disco.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default GitKrakenWorktrees;
