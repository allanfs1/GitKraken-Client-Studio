import React, { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  User, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  GitBranch, 
  Briefcase, 
  UserCheck, 
  ListTodo
} from "lucide-react";

interface JiraIssue {
  id: string;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "Done" | string;
  assignee: string;
  comments: string[];
}

interface GitRepository {
  id: string;
  name: string;
  description: string;
  activeBranch: string;
  branches: string[];
  commits: any[];
}

interface GitKrakenJiraProps {
  isLightTheme: boolean;
  jiraIssues: JiraIssue[];
  setJiraIssues: React.Dispatch<React.SetStateAction<JiraIssue[]>>;
  activeJiraIssueId: string | null;
  setActiveJiraIssueId: (id: string | null) => void;
  jiraCommentInput: string;
  setJiraCommentInput: (s: string) => void;
  newJiraTitle: string;
  setNewJiraTitle: (s: string) => void;
  newJiraDesc: string;
  setNewJiraDesc: (s: string) => void;
  newJiraAssignee: string;
  setNewJiraAssignee: (s: string) => void;
  activeSimRepo: GitRepository;
  setRepositories: any;
  selectedRepoIdSim: string;
  addTerminalLine: (s: string) => void;
  serverUser: any;
}

const GitKrakenJira: React.FC<GitKrakenJiraProps> = ({
  isLightTheme,
  jiraIssues,
  setJiraIssues,
  activeJiraIssueId,
  setActiveJiraIssueId,
  jiraCommentInput,
  setJiraCommentInput,
  newJiraTitle,
  setNewJiraTitle,
  newJiraDesc,
  setNewJiraDesc,
  newJiraAssignee,
  setNewJiraAssignee,
  activeSimRepo,
  setRepositories,
  selectedRepoIdSim,
  addTerminalLine,
  serverUser
}) => {
  const [isOpenCreator, setIsOpenCreator] = useState(false);

  const activeIssue = jiraIssues.find(issue => issue.id === activeJiraIssueId);

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJiraTitle.trim()) return;

    const nextIdNum = 101 + jiraIssues.length;
    const newIssue: JiraIssue = {
      id: `PROJ-${nextIdNum}`,
      title: newJiraTitle.trim(),
      description: newJiraDesc.trim() || "Nenhuma descrição detalhada fornecida.",
      status: "To Do",
      assignee: newJiraAssignee,
      comments: []
    };

    setJiraIssues(prev => [...prev, newIssue]);
    setActiveJiraIssueId(newIssue.id);
    setNewJiraTitle("");
    setNewJiraDesc("");
    setNewJiraAssignee("Unassigned");
    setIsOpenCreator(false);

    addTerminalLine(`[Jira Integration] Nova issue ${newIssue.id} criada: "${newIssue.title}" designada para ${newIssue.assignee}`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraCommentInput.trim() || !activeIssue) return;

    const userLabel = serverUser?.name || "Você";
    const newComment = `${userLabel}: ${jiraCommentInput.trim()}`;

    setJiraIssues(prev => prev.map(issue => {
      if (issue.id !== activeIssue.id) return issue;
      return {
        ...issue,
        comments: [...issue.comments, newComment]
      };
    }));

    setJiraCommentInput("");
    addTerminalLine(`[Jira Issue] Comentário cadastrado na tarefa ${activeIssue.id}`);
  };

  const handleStatusChange = (status: "To Do" | "In Progress" | "Done") => {
    if (!activeIssue) return;

    setJiraIssues(prev => prev.map(issue => {
      if (issue.id !== activeIssue.id) return issue;
      return { ...issue, status };
    }));

    addTerminalLine(`[Jira integration] Alterando status da tarefa ${activeIssue.id} para: ${status}`);
  };

  // Branch spawning linking workflow!
  const handleSpawnAndLinkBranch = () => {
    if (!activeIssue) return;

    const branchName = `feature/${activeIssue.id.toLowerCase()}`;
    
    // Check if branch already exists
    if (activeSimRepo.branches.includes(branchName)) {
      addTerminalLine(`>>> git checkout ${branchName}`);
      addTerminalLine(`[Branch Context] Ramificação ${branchName} já existia. Alternando cabeça do HEAD.`);
    } else {
      addTerminalLine(`>>> git checkout -b ${branchName}`);
      addTerminalLine(`[Branch Context] Criando e alternando para nova ramificação vinculada ao Jira: ${branchName}`);
    }

    // Update branches list & active branch
    setRepositories((prev: any) =>
      prev.map((r: any) => {
        if (r.id !== selectedRepoIdSim) return r;
        const updatedBranches = r.branches.includes(branchName) ? r.branches : [...r.branches, branchName];
        return {
          ...r,
          activeBranch: branchName,
          branches: updatedBranches
        };
      })
    );

    // Swap issue to In Progress automatically!
    setJiraIssues(prev => prev.map(issue => {
      if (issue.id !== activeIssue.id) return issue;
      return { 
        ...issue, 
        status: issue.status === "To Do" ? "In Progress" : issue.status 
      };
    }));
  };

  // Check if branch is linked to current issue
  const isBranchCurrentlyLinked = activeSimRepo.activeBranch?.toLowerCase().includes((activeIssue?.id || "").toLowerCase());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-stretch select-none">
      
      {/* Left Column: Kanban Board Pillars & Create tools */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Kanban Board Controls header */}
        <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-xs uppercase font-mono tracking-widest font-bold text-slate-300">Quadro de Sprints Integrado Jira</h3>
              <p className="text-[10px] text-slate-500 font-light">Os commits que incluem o ID da tarefa são vinculados e rotulados automaticamente no grafo.</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenCreator(!isOpenCreator)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/60 px-2.5 py-1.5 rounded-lg transition"
          >
            <Plus className="h-3.5 w-3.5" /> {isOpenCreator ? "Ocultar Formulário" : "Novo Item Jira"}
          </button>
        </div>

        {isOpenCreator && (
          <form onSubmit={handleCreateIssue} className={`p-5 rounded-2xl border space-y-3.5 ${isLightTheme ? "bg-white border-slate-200 shadow-md" : "bg-[#0d121c] border-slate-800 shadow-2xl"}`}>
            <h4 className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-bold">Simular Criação de Item Jira Cloud</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Título do Item</label>
                <input
                  type="text"
                  required
                  value={newJiraTitle}
                  onChange={(e) => setNewJiraTitle(e.target.value)}
                  placeholder="ex: Resolver travamento do gateway Stripe sob instabilidade"
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-850 text-slate-200"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Responsável</label>
                <select
                  value={newJiraAssignee}
                  onChange={(e) => setNewJiraAssignee(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-850 text-slate-200"}`}
                >
                  <option value="Carol">Carol (Dev)</option>
                  <option value="Bob">Bob (UX/UI)</option>
                  <option value="Alice">Alice (Lead)</option>
                  <option value="Unassigned">Não Designado (Backlog)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Descrição Detalhada</label>
              <textarea
                value={newJiraDesc}
                onChange={(e) => setNewJiraDesc(e.target.value)}
                placeholder="Insira detalhes de logs, cenários de reprodução ou escopo técnico..."
                rows={2}
                className={`w-full text-xs px-3 py-2 rounded-xl border outline-none resize-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-805" : "bg-slate-950 border-slate-850 text-slate-200"}`}
              />
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold font-mono py-2 px-4 rounded-xl transition"
            >
              Publicar no Backlog Jira
            </button>
          </form>
        )}

        {/* The 3 Kanban pillars in a balanced grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          
          {/* Pillar 1: To Do */}
          <div className="flex flex-col space-y-3.5 min-h-[350px]">
            <div className="flex items-center justify-between border-b border-indigo-900 pb-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#a8a19b] flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5 text-blue-450" /> Backlog / A Fazer
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-blue-950 border border-blue-900 text-blue-400 rounded-full font-bold">
                {jiraIssues.filter(i => i.status === "To Do").length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {jiraIssues.filter(i => i.status === "To Do").map(issue => (
                <div
                  key={issue.id}
                  onClick={() => setActiveJiraIssueId(issue.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col space-y-2 ${
                    activeJiraIssueId === issue.id
                      ? "bg-indigo-950/20 border-indigo-500"
                      : isLightTheme ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-705" : "bg-slate-900/60 border-transparent hover:border-slate-850 hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-[9px] font-mono font-bold text-slate-500">{issue.id}</span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold">{issue.assignee}</span>
                  </div>
                  <h4 className="text-xs font-semibold leading-relaxed text-slate-200 line-clamp-2">{issue.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 2: In Progress */}
          <div className="flex flex-col space-y-3.5 min-h-[350px]">
            <div className="flex items-center justify-between border-b border-amber-900 pb-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#a8a19b] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Em Progresso
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-amber-950 border border-amber-900 text-amber-400 rounded-full font-bold">
                {jiraIssues.filter(i => i.status === "In Progress").length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {jiraIssues.filter(i => i.status === "In Progress").map(issue => (
                <div
                  key={issue.id}
                  onClick={() => setActiveJiraIssueId(issue.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col space-y-2 ${
                    activeJiraIssueId === issue.id
                      ? "bg-indigo-950/20 border-indigo-500"
                      : isLightTheme ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-705" : "bg-slate-900/60 border-transparent hover:border-slate-850 hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-[9px] font-mono font-bold text-slate-500">{issue.id}</span>
                    <span className="text-[9px] font-mono text-amber-400 font-bold">{issue.assignee}</span>
                  </div>
                  <h4 className="text-xs font-semibold leading-relaxed text-slate-205 line-clamp-2">{issue.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 3: Done */}
          <div className="flex flex-col space-y-3.5 min-h-[350px]">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#a8a19b] flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Resolvido / Concluído
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-full font-bold">
                {jiraIssues.filter(i => i.status === "Done").length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {jiraIssues.filter(i => i.status === "Done").map(issue => (
                <div
                  key={issue.id}
                  onClick={() => setActiveJiraIssueId(issue.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col space-y-2 opacity-75 ${
                    activeJiraIssueId === issue.id
                      ? "bg-indigo-950/20 border-indigo-500"
                      : isLightTheme ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-705" : "bg-slate-900/60 border-transparent hover:border-slate-850 hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-[9px] font-mono font-bold text-slate-500 select-none line-through">{issue.id}</span>
                    <span className="text-[9px] font-mono text-emerald-400 font-semibold">{issue.assignee}</span>
                  </div>
                  <h4 className="text-xs font-semibold leading-relaxed text-slate-400 select-none line-through line-clamp-2">{issue.title}</h4>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Right Column: Focused details sidebar */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        {activeIssue ? (
          <div className={`p-5 rounded-2xl border flex flex-col space-y-4 h-full ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}>
            
            {/* ID & Designation block */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-1 select-none">
              <div>
                <span className="text-xs font-bold text-indigo-400 font-mono tracking-wider">{activeIssue.id}</span>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Tarefa Simulada</span>
              </div>

              <div className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-xs font-bold text-slate-200">{activeIssue.assignee}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-sm leading-snug">{activeIssue.title}</h3>

            {/* Status Selector bar */}
            <div className="space-y-1 font-mono">
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block mb-1.5">Atualizar Status</span>
              <div className="grid grid-cols-3 gap-1 grid-wrap text-[10px] bg-slate-950/60 p-1 rounded-xl">
                {(["To Do", "In Progress", "Done"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`py-1 rounded font-semibold text-center uppercase tracking-wide cursor-pointer transition text-[9px] ${
                      activeIssue.status === st
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description detailed */}
            <div className={`p-4 rounded-xl text-xs leading-relaxed ${isLightTheme ? "bg-slate-100 text-slate-700" : "bg-[#0d101a] text-slate-300"}`}>
              <h4 className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500 mb-1">Contexto Técnico do Item</h4>
              <p className="font-light">{activeIssue.description}</p>
            </div>

            {/* LINK BRANCH DIRECT WORKFLOW INTERACTIVE */}
            <div className="bg-indigo-950/30 border border-indigo-900/60 p-4 rounded-xl space-y-3 select-none">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <GitBranch className="h-4 w-4" /> Integração de Código
                </span>
                {isBranchCurrentlyLinked && (
                  <span className="text-[8.5px] uppercase font-semibold font-mono tracking-widest bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.2 rounded animate-pulse">Ativo</span>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-snug font-light">
                {isBranchCurrentlyLinked 
                  ? `Sua branch virtual ativa é vinculada a este item. Todo commit feito agora registrará o ID ${activeIssue.id} em seus metadados.`
                  : `Crie e mude imediatamente para a ramificação virtual de código chamada "feature/${activeIssue.id.toLowerCase()}" no simulador gráfico.`}
              </p>

              {!isBranchCurrentlyLinked && (
                <button
                  onClick={handleSpawnAndLinkBranch}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 text-white font-semibold text-[10px] uppercase font-mono py-2 rounded-lg transition tracking-wider flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3 shrink-0" /> Criar e Alternar Branch
                </button>
              )}
            </div>

            {/* Comments Thread Jira */}
            <div className="space-y-3.5 pt-3 border-t border-slate-850/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <MessageSquare className="h-4 w-4 text-slate-550 shrink-0" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#a8a19b] font-bold">Comentários do Time ({activeIssue.comments.length})</span>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {activeIssue.comments.length > 0 ? (
                  activeIssue.comments.map((comm, idx) => {
                    const separatorIndex = comm.indexOf(":");
                    const author = separatorIndex !== -1 ? comm.substring(0, separatorIndex) : "Virtual Dev";
                    const text = separatorIndex !== -1 ? comm.substring(separatorIndex + 1) : comm;
                    return (
                      <div key={idx} className="bg-slate-950/40 p-2 border border-slate-850/40 rounded-lg flex items-start gap-2 text-xs">
                        <div className="bg-slate-800 text-indigo-400 p-1 rounded-full text-[9px] shrink-0 font-bold min-w-[18px] text-center">
                          {author.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-300 text-[10px] block">{author}</span>
                          <span className="text-slate-400 leading-snug font-light text-[11px] block">{text}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] italic text-slate-500">Nenhum comentário enviado. Estimule o andamento comentando no painel.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-1.5">
                <input
                  type="text"
                  value={jiraCommentInput}
                  onChange={(e) => setJiraCommentInput(e.target.value)}
                  placeholder="Escreva sua notas ou log de bugfix..."
                  className={`flex-1 text-xs px-2.5 py-1.5 rounded-xl border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-805 text-slate-200"}`}
                />
                <button
                  type="submit"
                  className="bg-indigo-950 border border-indigo-900/60 hover:bg-[#111622] text-indigo-400 text-[9.5px] uppercase font-mono tracking-wide px-3 rounded-lg transition"
                >
                  OK
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 select-none border rounded-2xl bg-slate-950/10">
            <CheckSquare className="h-8 w-8 text-slate-700 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400">Nenhum Cartão Jira Selecionado</span>
            <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed font-light">Selecione uma tarefa visual no quadro Kanban para explorar as especificações estáticas, alterar andamentos, criar branches vinculados ou adicionar novos comentários.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default GitKrakenJira;
