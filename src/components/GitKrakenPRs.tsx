import React, { useState } from "react";
import { 
  GitPullRequest, 
  Plus, 
  MessageSquare, 
  Check, 
  Sparkles, 
  RefreshCw, 
  CornerDownRight, 
  User, 
  FileCode, 
  X,
  AlertTriangle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PRComment {
  author: string;
  text: string;
}

interface PullRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: string;
  author: string;
  date: string;
  comments: PRComment[];
  reviewMarkdown: string;
  reviewLoading: boolean;
  approvedBy: string[];
}

interface GitRepository {
  id: string;
  name: string;
  description: string;
  activeBranch: string;
  branches: string[];
  commits: any[];
}

interface GitKrakenPRsProps {
  isLightTheme: boolean;
  pullRequests: PullRequest[];
  setPullRequests: React.Dispatch<React.SetStateAction<PullRequest[]>>;
  activePRId: string | null;
  setActivePRId: (id: string | null) => void;
  newPRTitle: string;
  setNewPRTitle: (s: string) => void;
  newPRDesc: string;
  setNewPRDesc: (s: string) => void;
  newPRSource: string;
  setNewPRSource: (s: string) => void;
  newPRTarget: string;
  setNewPRTarget: (s: string) => void;
  prCommentInput: string;
  setPrCommentInput: (s: string) => void;
  activeSimRepo: GitRepository;
  setRepositories: any;
  selectedRepoIdSim: string;
  addTerminalLine: (s: string) => void;
  serverUser: any;
}

const GitKrakenPRs: React.FC<GitKrakenPRsProps> = ({
  isLightTheme,
  pullRequests,
  setPullRequests,
  activePRId,
  setActivePRId,
  newPRTitle,
  setNewPRTitle,
  newPRDesc,
  setNewPRDesc,
  newPRSource,
  setNewPRSource,
  newPRTarget,
  setNewPRTarget,
  prCommentInput,
  setPrCommentInput,
  activeSimRepo,
  setRepositories,
  selectedRepoIdSim,
  addTerminalLine,
  serverUser
}) => {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const activePR = pullRequests.find(pr => pr.id === activePRId);

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPRTitle.trim()) return;

    const newPR: PullRequest = {
      id: "pr-" + (pullRequests.length + 1),
      title: newPRTitle.trim(),
      description: newPRDesc.trim() || "Nenhuma descrição fornecida.",
      sourceBranch: newPRSource,
      targetBranch: newPRTarget,
      status: "Open",
      author: serverUser?.name || "Autor Virtual",
      date: new Date().toLocaleDateString("pt-BR"),
      comments: [],
      reviewMarkdown: "",
      reviewLoading: false,
      approvedBy: []
    };

    setPullRequests(prev => [newPR, ...prev]);
    setActivePRId(newPR.id);
    setNewPRTitle("");
    setNewPRDesc("");
    setIsOpenForm(false);
    setMergeError(null);
    addTerminalLine(`[Pull Request] PR criado: "${newPR.title}" de ${newPR.sourceBranch} para ${newPR.targetBranch}`);
  };

  const handleAddPRComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prCommentInput.trim() || !activePR) return;

    const commentator = serverUser?.name || "Você";
    const commentText = prCommentInput.trim();

    setPullRequests(prev => prev.map(pr => {
      if (pr.id !== activePR.id) return pr;
      return {
        ...pr,
        comments: [...pr.comments, { author: commentator, text: commentText }]
      };
    }));

    setPrCommentInput("");
    addTerminalLine(`[PR Comment] Adicionado comentário no PR #${activePR.id}`);
  };

  const handleRequestAIReview = async () => {
    if (!activePR) return;

    setPullRequests(prev => prev.map(pr => {
      if (pr.id !== activePR.id) return pr;
      return { ...pr, reviewLoading: true };
    }));

    addTerminalLine(`[AI Review] Enviando PR #${activePR.id} para revisão automática da inteligência artificial...`);

    try {
      // Mock diff data to give to Gemini API representing our virtual repository changes
      const diffFiles = [
        {
          filepath: "src/components/Checkout.tsx",
          status: "modified",
          diff: `@@ -120,8 +120,15 @@\n- function performCheckout() {\n-   payMock();\n- }\n+ function performCheckout() {\n+   // Conectando com gateway de pagamentos Stripe\n+   const stripeObj = getStripeInstance();\n+   stripeObj.confirmPayment({\n+     clientSecret: process.env.STRIPE_CLIENT_SECRET\n+   }).then(result => {\n+     addLogs("Transação processada!");\n+   });\n+ }`
        },
        {
          filepath: "package.json",
          status: "modified",
          diff: `@@ -15,2 +15,3 @@\n  "dependencies": {\n+   "stripe": "^15.1.0",\n    "react": "^18.0.0"`
        }
      ];

      const res = await fetch("/api/gemini/review-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activePR.title,
          description: activePR.description,
          sourceBranch: activePR.sourceBranch,
          targetBranch: activePR.targetBranch,
          files: diffFiles
        })
      });

      const data = await res.json();
      const reviewText = data.review || "Erro ao obter resposta da inteligência artificial.";

      setPullRequests(prev => prev.map(pr => {
        if (pr.id !== activePR.id) return pr;
        return { 
          ...pr, 
          reviewLoading: false, 
          reviewMarkdown: reviewText 
        };
      }));

      addTerminalLine(`[AI Review] Revisão do PR #${activePR.id} processada com sucesso via Gemini.`);
    } catch (err: any) {
      console.error(err);
      setPullRequests(prev => prev.map(pr => {
        if (pr.id !== activePR.id) return pr;
        return { 
          ...pr, 
          reviewLoading: false, 
          reviewMarkdown: `Ocorreu um erro ao chamar o Gemini: ${err.message || err}` 
        };
      }));
      addTerminalLine(`[AI Review Error] Falha de comunicação com o servidor Gemini.`);
    }
  };

  const handleApprovePR = () => {
    if (!activePR) return;
    const authorName = serverUser?.name || "Você (Aprovador)";

    setPullRequests(prev => prev.map(pr => {
      if (pr.id !== activePR.id) return pr;
      if (pr.approvedBy.includes(authorName)) return pr;
      return {
        ...pr,
        approvedBy: [...pr.approvedBy, authorName]
      };
    }));

    addTerminalLine(`[PR Approval] Aprovado por ${authorName}. Pronto para mesclagem.`);
  };

  const handleMergePR = () => {
    if (!activePR) return;
    setMergeError(null);

    if (activePR.sourceBranch === activePR.targetBranch) {
      setMergeError("A ramificação de origem e de destino são idênticas. Modifique as branches do Pull Request.");
      return;
    }

    addTerminalLine(`>>> git checkout ${activePR.targetBranch}`);
    addTerminalLine(`>>> git merge ${activePR.sourceBranch} --no-ff -m "Merge pull request #${activePR.id} de ${activePR.sourceBranch}"`);

    // Merge logic
    const randSha = Math.random().toString(16).substring(2, 8);
    const dateFormatted = new Date().toLocaleDateString("pt-BR");
    
    // Create merge commit in the simulation
    const mergeCommit = {
      sha: randSha,
      parents: activeSimRepo.commits.length > 0 ? [activeSimRepo.commits[0].sha] : [],
      message: `Merge pull request #${activePR.id} de ${activePR.sourceBranch}\n\n${activePR.title}`,
      author: serverUser?.name || "Você (Merge Master)",
      email: serverUser?.login ? `${serverUser.login}@git.net` : "dev@kraken-org.local",
      date: dateFormatted,
      branch: activePR.targetBranch,
      isMerge: true,
      avatarUrl: serverUser?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
      pushed: false
    };

    setRepositories((prev: any) =>
      prev.map((r: any) => {
        if (r.id !== selectedRepoIdSim) return r;
        return {
          ...r,
          activeBranch: activePR.targetBranch,
          commits: [mergeCommit, ...r.commits]
        };
      })
    );

    setPullRequests(prev => prev.map(pr => {
      if (pr.id !== activePR.id) return pr;
      return { ...pr, status: "Merged" };
    }));

    addTerminalLine(`[PR Merged] Sucesso! PR #${activePR.id} foi mesclado virtualmente na branch ${activePR.targetBranch}.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-stretch select-none">
      
      {/* Left Sidebar: List of PRs & Create Button */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div className={`p-5 rounded-2xl border ${isLightTheme ? "bg-white border-slate-201" : "bg-slate-900 border-slate-850"}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
            <h3 className="text-xs uppercase font-mono tracking-widest font-bold text-indigo-400 flex items-center gap-1.5">
              <GitPullRequest className="h-4 w-4 text-indigo-400" /> Pull Requests ({pullRequests.length})
            </h3>
            <button
              onClick={() => setIsOpenForm(!isOpenForm)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/60 px-2 py-1 rounded cursor-pointer transition"
            >
              <Plus className="h-3 w-3" /> {isOpenForm ? "Fechar" : "Criar PR"}
            </button>
          </div>

          {isOpenForm ? (
            <form onSubmit={handleCreatePR} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Título do PR</label>
                <input
                  type="text"
                  required
                  value={newPRTitle}
                  onChange={(e) => setNewPRTitle(e.target.value)}
                  placeholder="ex: feat: add checkout gateway connections"
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Descrição</label>
                <textarea
                  value={newPRDesc}
                  onChange={(e) => setNewPRDesc(e.target.value)}
                  placeholder="O que este Pull Request introduz?"
                  rows={2}
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none resize-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-500">De (Origem)</label>
                  <select
                    value={newPRSource}
                    onChange={(e) => setNewPRSource(e.target.value)}
                    className={`w-full text-xs p-2 rounded-lg border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200"}`}
                  >
                    {activeSimRepo.branches.map(br => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Para (Target)</label>
                  <select
                    value={newPRTarget}
                    onChange={(e) => setNewPRTarget(e.target.value)}
                    className={`w-full text-xs p-2 rounded-lg border outline-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200"}`}
                  >
                    {activeSimRepo.branches.map(br => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2 px-3 rounded-xl transition"
              >
                Abrir Pull Request Oficial
              </button>
            </form>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {pullRequests.map(pr => {
                const isActive = pr.id === activePRId;
                const isMerged = pr.status === "Merged";
                return (
                  <div
                    key={pr.id}
                    onClick={() => {
                      setActivePRId(pr.id);
                      setMergeError(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                      isActive 
                        ? "bg-indigo-950/30 border-indigo-500 text-slate-100" 
                        : isLightTheme ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-slate-950/60 hover:bg-slate-950 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between pointer-events-none gap-2 mb-1">
                      <span className="text-[9px] font-mono tracking-wider font-bold uppercase text-slate-500">#{pr.id}</span>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        isMerged ? "bg-purple-950 text-purple-400 border border-purple-900" : "bg-emerald-950 text-emerald-400 border border-emerald-900"
                      }`}>
                        {pr.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold leading-snug line-clamp-2">{pr.title}</h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/40 mt-2">
                      <span className="truncate max-w-[120px]">De: {pr.sourceBranch}</span>
                      <span>{pr.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Focused PR details & actions */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        {activePR ? (
          <div className={`p-6 rounded-2xl border flex flex-col space-y-5 h-full ${isLightTheme ? "bg-white border-slate-200 shadow-md" : "bg-slate-900 border-slate-850 shadow-xl"}`}>
            
            {/* PR Main Header Block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.2 uppercase ${
                    activePR.status === "Merged" ? "bg-purple-950 text-purple-400 border-purple-900" : "bg-emerald-955 text-emerald-400 border-emerald-900"
                  }`}>{activePR.status}</span>
                  <span className="text-slate-500 font-mono text-xs font-medium">#{activePR.id} • Aberto por {activePR.author}</span>
                </div>
                <h2 className="font-display font-semibold text-lg leading-snug">{activePR.title}</h2>
              </div>

              {activePR.status === "Open" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleApprovePR}
                    className="bg-emerald-950/75 border border-emerald-900/80 hover:bg-[#11191a] text-emerald-400 px-3.5 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer transition flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Aprovar
                  </button>
                  <button
                    onClick={handleMergePR}
                    className="bg-indigo-600 hover:bg-indigo-505 text-white px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-mono font-bold tracking-wider cursor-pointer shadow shadow-indigo-600/30 transition flex items-center gap-1"
                  >
                    <GitPullRequest className="h-3.5 w-3.5" /> Mesclar PR (Merge)
                  </button>
                </div>
              )}
            </div>

            {mergeError && (
              <div className="p-3.5 rounded-xl border border-rose-800 bg-rose-950/45 text-rose-350 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-450 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block uppercase font-mono text-[9px] tracking-wider text-rose-400">Impasse de Mesclagem</span>
                  <span>{mergeError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setMergeError(null)}
                  className="text-slate-500 hover:text-white text-[10px] pr-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Source and Target Branch indicators */}
            <div className="flex items-center gap-2 bg-[#0c101b] p-3 rounded-xl border border-slate-850/80 select-none text-xs">
              <span className="text-slate-500 font-mono uppercase tracking-wider text-[9px] font-bold">Branch Path:</span>
              <span className="bg-indigo-950 text-indigo-400 font-mono border border-indigo-900/60 rounded px-2 py-0.5 font-bold">{activePR.sourceBranch}</span>
              <CornerDownRight className="h-4 w-4 text-slate-700 mx-1 shrink-0" />
              <span className="bg-slate-950 text-slate-400 font-mono border border-slate-850 rounded px-2 py-0.5 font-semibold">{activePR.targetBranch}</span>
            </div>

            {/* PR Description */}
            <div className={`p-4 rounded-xl text-xs leading-relaxed ${isLightTheme ? "bg-slate-50 text-slate-700" : "bg-slate-950 text-slate-300"}`}>
              <h4 className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500 mb-1">Descrição do Pull Request</h4>
              <p>{activePR.description}</p>
            </div>

            {/* AI CODE REVIEW INTEGRATION COMPONENT */}
            <div className="border border-indigo-900/40 bg-indigo-950/15 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-200">Revisão Estática de Código com IA (Gemini)</span>
                </div>
                {activePR.status === "Open" && (
                  <button
                    onClick={handleRequestAIReview}
                    disabled={activePR.reviewLoading}
                    className="text-[10px] py-1 px-3.5 font-bold uppercase tracking-wider font-mono bg-indigo-950 border border-indigo-800 text-indigo-300 hover:text-white rounded-lg transition disabled:opacity-40"
                  >
                    {activePR.reviewLoading ? "Analisando..." : "Gerar Revisão IA"}
                  </button>
                )}
              </div>

              {activePR.reviewLoading ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2">
                  <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
                  <span className="text-[10.5px] font-mono text-slate-500">Gemini está analisando o diff de commits e testando regras estáticas...</span>
                </div>
              ) : activePR.reviewMarkdown ? (
                <div className={`p-3.5 rounded-lg text-[11px] prose prose-invert max-h-48 overflow-y-auto ${isLightTheme ? "bg-slate-100 text-slate-800" : "bg-[#0c101a] border border-indigo-950 text-slate-300"}`}>
                  <ReactMarkdown>{activePR.reviewMarkdown}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-[10.5px] italic text-slate-500">Peça a revisão automática para receber sugestões de performance, validações e relatórios estáticos.</p>
              )}
            </div>

            {/* Approvals Checklist */}
            <div className="flex items-center gap-2 flex-wrap text-xs select-none">
              <span className="text-slate-500 font-mono text-[10px] uppercase font-bold">Aprovado por:</span>
              {activePR.approvedBy.length > 0 ? (
                activePR.approvedBy.map(appr => (
                  <span key={appr} className="bg-emerald-950 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1">
                    <Check className="h-3 w-3" /> {appr}
                  </span>
                ))
              ) : (
                <span className="text-slate-600 italic">Nenhuma aprovação registrada. Este PR pode estar bloqueado para merge em produção.</span>
              )}
            </div>

            {/* Comments Thread Section */}
            <div className="space-y-3.5 pt-4 border-t border-slate-850/80">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span className="text-[10.5px] uppercase font-mono tracking-widest text-[#a8a19b] font-bold">Discussões de Review ({activePR.comments.length})</span>
              </div>

              {/* List Comments */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {activePR.comments.map((comm, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/40 flex items-start gap-2.5 text-xs">
                    <div className="bg-slate-800 text-indigo-400 p-1.5 rounded-full shrink-0 font-bold text-[10px]">
                      {comm.author.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block text-[10px]">{comm.author}</span>
                      <p className="text-slate-400 leading-snug mt-0.5">{comm.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {activePR.status === "Open" && (
                <form onSubmit={handleAddPRComment} className="flex gap-2">
                  <input
                    type="text"
                    value={prCommentInput}
                    onChange={(e) => setPrCommentInput(e.target.value)}
                    placeholder="Adicione feedback ou nova instrução de correção de bug..."
                    className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none ${isLightTheme ? "bg-slate-100 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500"}`}
                  />
                  <button
                    type="submit"
                    className="bg-indigo-950 hover:bg-[#111522] border border-indigo-900/60 text-indigo-450 text-[10px] uppercase font-mono font-bold tracking-wide px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Enviar
                  </button>
                </form>
              )}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 select-none border rounded-2xl bg-slate-950/10">
            <GitPullRequest className="h-8 w-8 text-slate-700 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400">Nenhum Pull Request Selecionado</span>
            <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed font-light">Crie um novo PR ou selecione algum na listagem lateral para inspecionar, revisar ou mesclar.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default GitKrakenPRs;
