import React, { useState, useEffect, useRef } from "react";
import {
  Github,
  Server,
  GitBranch,
  Activity,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Link2,
  Terminal,
  Code,
  Copy,
  Check,
  LogOut,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  Layers,
  ChevronDown,
  Sun,
  Moon,
  GitCommit,
  GitFork,
  ArrowRight,
  FolderOpen,
  Plus,
  Minus,
  Settings,
  FolderSync,
  Search,
  X,
  Folder,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Tag,
  ChevronLeft,
  Edit2,
  GitPullRequest,
  Users,
  BarChart3,
  CheckSquare,
  TrendingUp
} from "lucide-react";

import { Commit, FileState, Stash, GitRepository, AppState as ServerState } from "./types";
import GitGraph, { getBranchColorClass } from "./components/GitGraph";
import MergeConflictEditor from "./components/MergeConflictEditor";
import TerminalView from "./components/TerminalView";
import DiffViewer from "./components/DiffViewer";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import GitKrakenPRs from "./components/GitKrakenPRs";
import GitKrakenJira from "./components/GitKrakenJira";
import GitKrakenGitLens from "./components/GitKrakenGitLens";
import GitKrakenWorktrees from "./components/GitKrakenWorktrees";
import DraggableDashboard from "./components/DraggableDashboard";

// Safely parse JSON from fetch responses
async function safeJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.toLowerCase().includes("application/json")) {
    try {
      return await res.json() as T;
    } catch (_) {
      return null;
    }
  }
  return null;
}

export default function App() {
  const hasFetchedGithubReposRef = useRef(false);

  // Global View tabs: "gitkraken" (Git Client Dashboard / Simulator), "gitdeploy" (The old Webhooks Continuous Deployment logs), or "analytics" (Real-time charts and metrics)
  const [activeTab, setActiveTab] = useState<"gitkraken" | "gitdeploy" | "analytics">("gitkraken");

  // Server state (GitKraken backend metadata)
  const [serverState, setServerState] = useState<ServerState>({
    hasOAuthKeys: false,
    connected: false,
    user: null,
    connectedRepo: null,
    deployments: [],
    webhooks: [],
    redirectUri: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Connection form fields (CD tab)
  const [personalToken, setPersonalToken] = useState("");
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [repoSearch, setRepoSearch] = useState("");

  // CD tab internals
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [infoTab, setInfoTab] = useState<"deployments" | "webhooks" | "setup">("deployments");
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);

  // --- CONFIGURAÇÃO DESSA SESSÃO DE GIT (GIT CONFIG) ---
  const [gitConfigName, setGitConfigName] = useState<string>("Dev Kraken");
  const [gitConfigEmail, setGitConfigEmail] = useState<string>("dev@kraken-org.local");
  const [gitConfigAvatar, setGitConfigAvatar] = useState<string>("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop");
  const [showConfigEditor, setShowConfigEditor] = useState<boolean>(false);

  // Sync with logged in user if available
  useEffect(() => {
    if (serverState.user) {
      setGitConfigName(serverState.user.name || serverState.user.login || "Dev Kraken");
      setGitConfigEmail(serverState.user.login ? `${serverState.user.login}@git.net` : "dev@kraken-org.local");
      if (serverState.user.avatar_url) {
        setGitConfigAvatar(serverState.user.avatar_url);
      }
    }
  }, [serverState.user]);

  // --- GITKRAKEN CLIENT SIMULATOR INTERNAL STATE ---
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [selectedRepoIdSim, setSelectedRepoIdSim] = useState<string>("react-ui-main");

  // --- TOAST NOTIFICATIONS HUB STATE ---
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    // Keep it interactive. Dismiss automatically
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // --- NEW WORKSPACE SUB-TABS (EXPLORER, PRS, JIRA, GITLENS, WORKTREES) ---
  const [krakenSubTab, setKrakenSubTab] = useState<"explorer" | "prs" | "jira" | "gitlens" | "worktrees">("explorer");
  const [activeGitProvider, setActiveGitProvider] = useState<"github" | "gitlab" | "bitbucket" | "azure" | "selfhosted">("github");

  // --- JIRA INTEGRATION STATE ---
  const [jiraIssues, setJiraIssues] = useState([
    { id: "PROJ-101", title: "Painel de checkout instável sob carga extrema", description: "Verificar vazamentos de conexão e buffers WebGL na renderização de gráficos de checkout complexos.", status: "To Do", assignee: "Carol", comments: ["Alice: Já comecei a olhar o gargalo do renderizador.", "Carol: Vou simular com o motor 3D."] },
    { id: "PROJ-102", title: "MFA via SMS/E-mail no fluxo de login", description: "Implementar autenticação em dois fatores na branch bugfix/auth no repositório React.", status: "In Progress", assignee: "Bob", comments: ["Bob: Integração da API de SMS concluída."] },
    { id: "PROJ-103", title: "Configurar Webhooks no GitLab CI", description: "Estabelecer webhooks para automatizar compilação e publicação automática no ambiente de staging.", status: "Done", assignee: "Alice", comments: [] },
    { id: "PROJ-104", title: "Refatorar matrizes do motor geométrico", description: "Mover lógica de cálculo de colisões para WASM visando otimizar performance.", status: "To Do", assignee: "Unassigned", comments: [] }
  ]);
  const [activeJiraIssueId, setActiveJiraIssueId] = useState<string | null>("PROJ-101");
  const [jiraCommentInput, setJiraCommentInput] = useState("");
  const [newJiraTitle, setNewJiraTitle] = useState("");
  const [newJiraDesc, setNewJiraDesc] = useState("");
  const [newJiraAssignee, setNewJiraAssignee] = useState("Unassigned");

  // --- PULL REQUESTS HUB STATE ---
  const [pullRequests, setPullRequests] = useState([
    {
      id: "pr-1",
      title: "feat: interface de checkout e integrações stripe",
      description: "Este PR unifica a nova tela de checkout e conecta o meio de pagamento Stripe na stack interactiva.",
      sourceBranch: "feature/payments",
      targetBranch: "main",
      status: "Open",
      author: "Carol (Developer)",
      date: "08/06/2026",
      comments: [
        { author: "Alice", text: "Excelente trabalho! Os diffs de package.json parecem limpos." },
        { author: "Bob", text: "Fiz o review e os testes rodaram nominalmente." }
      ],
      reviewMarkdown: "",
      reviewLoading: false,
      approvedBy: [] as string[]
    }
  ]);
  const [activePRId, setActivePRId] = useState<string | null>("pr-1");
  const [newPRTitle, setNewPRTitle] = useState("");
  const [newPRDesc, setNewPRDesc] = useState("");
  const [newPRSource, setNewPRSource] = useState("feature/payments");
  const [newPRTarget, setNewPRTarget] = useState("main");
  const [prCommentInput, setPrCommentInput] = useState("");

  const [repoStats, setRepoStats] = useState<any>(null);

  // --- WORKTREES STATE ---
  const [worktrees, setWorktrees] = useState([
    { id: "wt-1", name: "Main Project Dir", path: "./", branch: "main", isActive: true },
    { id: "wt-2", name: "payments-worktree", path: "./worktrees/feature-payments", branch: "feature/payments", isActive: false }
  ]);
  const [newWorktreeBranch, setNewWorktreeBranch] = useState("feature/checkout");
  const [newWorktreePath, setNewWorktreePath] = useState("./worktrees/checkout-ref");

  // --- GITLENS INTERNAL EXPLAINER STATE ---
  const [gitLensActiveFile, setGitLensActiveFile] = useState<string>("src/components/Checkout.tsx");
  const [gitLensExplanation, setGitLensExplanation] = useState<string>("");
  const [gitLensExplaining, setGitLensExplaining] = useState<boolean>(false);
  
  // --- COMMIT GENERATION WITH AI STATE ---
  const [isCommittingAI, setIsCommittingAI] = useState(false);

  // --- PREMIUM GITKRAKEN EXPERIENCES (FUZZY FINDER, SHORTCUTS, DIRECTORY COLLAPSING, UNDO/REDO) ---
  const [isFuzzyFinderOpen, setIsFuzzyFinderOpen] = useState(false);
  const [fuzzySearchQuery, setFuzzySearchQuery] = useState("");
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRepoImportModalOpen, setIsRepoImportModalOpen] = useState(false);
  const [importRepoName, setImportRepoName] = useState("");
  const [importRepoDesc, setImportRepoDesc] = useState("");

  const [collapsedSections, setCollapsedSections] = useState({
    repos: false,
    branches: false,
    remotes: false,
    pullrequests: false,
    issues: false,
    stashes: false,
  });

  const [collapsedFolders, setCollapsedFolders] = useState<{ [folderName: string]: boolean }>({
    "feature": false,
    "bugfix": false,
    "physics": false
  });
  const [globalFilterText, setGlobalFilterText] = useState("");
  const [undoneCommitsStack, setUndoneCommitsStack] = useState<{ [repoId: string]: Commit[] }>({});

  // Initial mock repositories data structures
  const [repositories, setRepositories] = useState<GitRepository[]>([
    {
      id: "react-ui-main",
      name: "React Interactive Dashboard",
      description: "Frontend layout and components for user workspace and stats visualizations",
      activeBranch: "main",
      branches: ["main", "feature/payments", "feature/checkout", "bugfix/auth", "bugfix/responsive"],
      tags: [{ name: "v1.2.0-rc", sha: "c5" }],
      unstagedFiles: [
        {
          filepath: "src/components/Checkout.tsx",
          status: "modified",
          content: "const stripe = require('stripe')('sk_live_key');\nconsole.log('Secure channel payment token generated!');",
          originalContent: "const stripe = null;\nconsole.log('Payment inactive...');",
          diff: "- const stripe = null;\n- console.log('Payment inactive...');\n+ const stripe = require('stripe')('sk_live_key');\n+ console.log('Secure channel payment token generated!');"
        },
        {
          filepath: "package.json",
          status: "modified",
          content: '{\n  "name": "react-dashboard",\n  "version": "1.2.1-beta1",\n  "dependencies": {\n    "stripe": "^15.1.0"\n  }\n}',
          originalContent: '{\n  "name": "react-dashboard",\n  "version": "1.2.0"\n}',
          diff: '-   "version": "1.2.0"\n+   "version": "1.2.1-beta1",\n+   "dependencies": {\n+     "stripe": "^15.1.0"\n+   }'
        }
      ],
      stagedFiles: [],
      stashes: [],
      commits: [
        {
          sha: "71cdba",
          parents: ["f1a1d3"],
          message: "Merge branch 'feature-payments' into main",
          author: "Alice",
          email: "alice@company.com",
          date: "08/06/2026",
          branch: "main",
          isMerge: true,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
        },
        {
          sha: "aef912",
          parents: ["c28fed"],
          message: "feat: connect Stripe sandbox tokens",
          author: "Carol (Developer)",
          email: "carol@dev.internal",
          date: "06/06/2026",
          branch: "feature-payments",
          avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop"
        },
        {
          sha: "f1a1d3",
          parents: ["c28fed"],
          message: "fix: solve navigation keyboard focus traps",
          author: "Bob (Core)",
          email: "bob@company.com",
          date: "05/06/2026",
          branch: "main",
          avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop"
        },
        {
          sha: "c28fed",
          parents: ["41a7b2"],
          message: "feat: add customer workspace stats layout panel",
          author: "Carol (Developer)",
          email: "carol@dev.internal",
          date: "03/06/2026",
          branch: "feature-payments",
          avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop"
        },
        {
          sha: "41a7b2",
          parents: [],
          message: "Initial commit - react-app template scaffold",
          author: "Alice",
          email: "alice@company.com",
          date: "01/06/2026",
          branch: "main",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
        }
      ]
    },
    {
      id: "spatial-3d-engine",
      name: "High-Fidelity 3D Spatial Engine",
      description: "C++ WebAssembly bundle optimized for collision calculations, multi-threaded matrix pooling and WebGL pipelines",
      activeBranch: "master",
      branches: ["master", "physics/vector-refactor", "physics/matrix-pool", "bugfix/webgl-buffers"],
      tags: [{ name: "v3.1.0-gold", sha: "w2" }],
      unstagedFiles: [
        {
          filepath: "wasm/physics.cpp",
          status: "modified",
          content: "void solveCollisions() {\n    // Faster matrix pools\n    physics_v2::calculate_gravity_splines();\n}",
          originalContent: "void solveCollisions() {\n    physics::legacy_gravity_resolution();\n}",
          diff: "-     physics::legacy_gravity_resolution();\n+     // Faster matrix pools\n+     physics_v2::calculate_gravity_splines();"
        }
      ],
      stagedFiles: [],
      stashes: [],
      commits: [
        {
          sha: "w4",
          parents: ["w3"],
          message: "refactor: migrate dynamic vector pools to C++23 standards",
          author: "Bob (Core)",
          email: "bob@company.com",
          date: "07/06/2026",
          branch: "master",
          avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop"
        },
        {
          sha: "w3",
          parents: ["w2"],
          message: "feat: compile physics matrix calculations cleanly into WASM bundle",
          author: "Alice",
          email: "alice@company.com",
          date: "05/06/2026",
          branch: "physics-refactor",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
        },
        {
          sha: "w2",
          parents: ["w1"],
          message: "build: optimize WebGL vertex buffers sizing parameters",
          author: "Bob (Core)",
          email: "bob@company.com",
          date: "03/06/2026",
          branch: "master",
          avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop"
        },
        {
          sha: "w1",
          parents: [],
          message: "Initial repository commit for Spatial Physics Engine",
          author: "Alice",
          email: "alice@company.com",
          date: "01/06/2026",
          branch: "master",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
        }
      ]
    }
  ]);

  // Selected Commit on Graph
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>("71cdba");

  // Selection inside working files / differences view
  const [activeDiffFile, setActiveDiffFile] = useState<FileState | null>(null);

  // Active Git conflict file mapping
  const [conflictFile, setConflictFile] = useState<FileState | null>(null);

  // Interactive CLI logs console
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Processando carregamento do motor CLI Git Kraken...",
    "Ambiente simulado carregado com sucesso.",
    "Tópicos disponíveis para simulação: checkout, commit, status, branch, merge, help, clear.",
    "Envio de sinal de boas-vindas: Digite seus comandos ou experimente as funções do painel!",
    ""
  ]);

  // Add inputs for commit messages
  const [commitTitle, setCommitTitle] = useState("");
  const [commitDesc, setCommitDesc] = useState("");

  // Selected Repository Simulator Reference
  const activeSimRepo = repositories.find((r) => r.id === selectedRepoIdSim) || repositories[0];

  // Sync Diff state when repo switches
  useEffect(() => {
    setSelectedCommitSha(activeSimRepo.commits[0]?.sha || null);
    if (activeSimRepo.unstagedFiles.length > 0) {
      setActiveDiffFile(activeSimRepo.unstagedFiles[0]);
    } else {
      setActiveDiffFile(null);
    }
    setConflictFile(null);
  }, [selectedRepoIdSim]);

  // Sync local selected commit changes to show in properties on panel
  const selectedSimCommit = activeSimRepo.commits.find((c) => c.sha === selectedCommitSha);

  // Fetch CD API State
  const fetchState = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await safeJson<ServerState>(res);
        if (data) {
          setServerState(data);
          setErrorMessage(null);

          if (data.connected && !hasFetchedGithubReposRef.current) {
            fetchGithubRepos();
          }

          if (data.deployments.length > 0 && !activeDeploymentId) {
            setActiveDeploymentId(data.deployments[0].id);
          }
        }
      }
    } catch (err) {
      // Offline fallback state will keep running cleanly
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchGithubRepos = async () => {
    setRepoLoading(true);
    hasFetchedGithubReposRef.current = true;
    try {
      const res = await fetch("/api/github/repos");
      if (res.ok) {
        const data = await safeJson<any[]>(res);
        if (data) setGithubRepos(data);
      }
    } catch (err) {
      console.error(err);
      hasFetchedGithubReposRef.current = false;
    } finally {
      setRepoLoading(false);
    }
  };

  // Poll state during active builds for deployment monitor
  useEffect(() => {
    fetchState();
    const poller = setInterval(() => {
      fetchState(true);
    }, 4000);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchState(true);
        showToast("GitHub conectado com sucesso via OAuth!", "success");
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(poller);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // State to track files of selected commit from GitHub real repo
  const [githubCommitFiles, setGithubCommitFiles] = useState<any[]>([]);
  const [githubFilesLoading, setGithubFilesLoading] = useState(false);
  const [githubLoadingDetails, setGithubLoadingDetails] = useState(false);

  // Append real GitHub repositories to list of repositories available for visual simulation
  useEffect(() => {
    if (githubRepos.length > 0) {
      setRepositories((prev) => {
        // Keep non-github repositories (the mock ones that exist in memory)
        const locals = prev.filter((r) => !r.id.startsWith("github-"));
        const gits: GitRepository[] = githubRepos.map((r) => {
          // If already exists in memory with commits, preserve it to prevent flicker
          const existing = prev.find((p) => p.id === `github-${r.id}`);
          if (existing && existing.commits[0]?.sha !== "loading") return existing;

          return {
            id: `github-${r.id}`,
            name: `${r.name} (GitHub)`,
            description: r.description || "Repositório real sincronizado integrado ao painel.",
            activeBranch: serverState.connectedRepo?.id === r.id ? serverState.connectedRepo.branch : "main",
            branches: ["main"],
            tags: [],
            unstagedFiles: [],
            stagedFiles: [],
            stashes: [],
            commits: [
              {
                sha: "loading",
                parents: [],
                message: "Sincronizando histórico de commits remoto com o GitKraken Client...",
                author: "GitHub Engine",
                email: "api@github.com",
                date: "Hoje",
                branch: "main",
              }
            ]
          };
        });
        return [...locals, ...gits];
      });
    } else {
      setRepositories((prev) => prev.filter((r) => !r.id.startsWith("github-")));
    }
  }, [githubRepos, serverState.connectedRepo]);

  // Read commits and branches for real GitHub repositories
  useEffect(() => {
    if (!selectedRepoIdSim.startsWith("github-")) return;

    const gitRepoId = Number(selectedRepoIdSim.replace("github-", ""));
    const realRepo = githubRepos.find((r) => r.id === gitRepoId);
    if (!realRepo) return;

    const loadRealRepoDetails = async () => {
      setGithubLoadingDetails(true);
      addTerminalLine(`[GitHub Sincronização] Iniciando leitura de ${realRepo.full_name}...`);

      try {
        const urlParams = new URL(window.location.href);
        urlParams.pathname = "/api/github/branches";
        urlParams.searchParams.set("repo", realRepo.full_name);
        
        const bRes = await fetch(urlParams.pathname + urlParams.search);
        let branches = ["main"];
        if (bRes.ok) {
          const bData = await bRes.json();
          if (Array.isArray(bData) && bData.length > 0) {
            branches = bData;
          }
        }

        let activeBranch = branches.includes("main") ? "main" : branches.includes("master") ? "master" : branches[0] || "main";
        if (serverState.connectedRepo && serverState.connectedRepo.id === realRepo.id && branches.includes(serverState.connectedRepo.branch)) {
          activeBranch = serverState.connectedRepo.branch;
        }

        await fetchGitHubCommitsForBranch(realRepo.full_name, activeBranch, branches);
        await fetchGitHubPullsAndIssues(realRepo.full_name);
      } catch (err) {
        addTerminalLine(`[Erro GitHub] Falha ao ler metadados do repositório: ${err}`);
      } finally {
        setGithubLoadingDetails(false);
      }
    };

    loadRealRepoDetails();
  }, [selectedRepoIdSim, githubRepos]);

  const fetchGitHubPullsAndIssues = async (fullName: string) => {
    try {
      const pRes = await fetch(`/api/github/pulls?repo=${encodeURIComponent(fullName)}`);
      if (pRes.ok) {
        const pulls = await pRes.json();
        if (Array.isArray(pulls) && pulls.length > 0) {
          setPullRequests(pulls);
          setActivePRId(pulls[0].id);
        } else {
          setPullRequests([]);
        }
      }

      const iRes = await fetch(`/api/github/issues?repo=${encodeURIComponent(fullName)}`);
      if (iRes.ok) {
        const issues = await iRes.json();
        if (Array.isArray(issues) && issues.length > 0) {
          setJiraIssues(issues);
          setActiveJiraIssueId(issues[0].id);
        } else {
          setJiraIssues([]);
        }
      }

      const sRes = await fetch(`/api/github/repo-stats?repo=${encodeURIComponent(fullName)}`);
      if (sRes.ok) {
        const stats = await sRes.json();
        setRepoStats(stats);
      } else {
        setRepoStats(null);
      }
    } catch (err) {
      console.error("Falha ao buscar issues/PRs/stats", err);
    }
  };

  const fetchGitHubCommitsForBranch = async (fullName: string, branchName: string, branchesList?: string[]) => {
    try {
      const urlParams = new URL(window.location.href);
      urlParams.pathname = "/api/github/commits";
      urlParams.searchParams.set("repo", fullName);
      urlParams.searchParams.set("branch", branchName);

      const cRes = await fetch(urlParams.pathname + urlParams.search);
      if (cRes.ok) {
        const commits = await cRes.json();
        if (Array.isArray(commits) && commits.length > 0) {
          setRepositories((prev) =>
            prev.map((r) => {
              if (r.id !== selectedRepoIdSim) return r;
              return {
                ...r,
                activeBranch: branchName,
                branches: branchesList || r.branches,
                commits: commits,
              };
            })
          );
          setSelectedCommitSha(commits[0].sha);
          addTerminalLine(`[GitHub Sincronização] Sucesso! ${commits.length} commits importados para a ramificação [${branchName}].`);
        } else {
          addTerminalLine(`[GitHub Sincronização] Sem commits recentes no branch ${branchName}.`);
        }
      } else {
        addTerminalLine(`[GitHub Sincronização] Falha com status ${cRes.status} ao carregar histórico.`);
      }
    } catch (err) {
      addTerminalLine(`[Erro GitHub] Conexão mal-sucedida: ${err}`);
    }
  };

  // Sync real-time selection of a GitHub commit
  useEffect(() => {
    if (!selectedCommitSha) return;
    if (!selectedRepoIdSim.startsWith("github-")) {
      setGithubCommitFiles([]);
      return;
    }

    const gitRepoId = Number(selectedRepoIdSim.replace("github-", ""));
    const realRepo = githubRepos.find((r) => r.id === gitRepoId);
    if (!realRepo) return;

    if (selectedCommitSha === "loading") return;

    const fetchDetail = async () => {
      setGithubFilesLoading(true);
      try {
        const urlParams = new URL(window.location.href);
        urlParams.pathname = "/api/github/commit-detail";
        urlParams.searchParams.set("repo", realRepo.full_name);
        urlParams.searchParams.set("sha", selectedCommitSha);

        const res = await fetch(urlParams.pathname + urlParams.search);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.files)) {
            setGithubCommitFiles(data.files);
            if (data.files.length > 0) {
              const firstFile = data.files[0];
              setActiveDiffFile({
                filepath: firstFile.filepath,
                status: firstFile.status,
                content: "",
                originalContent: "",
                diff: firstFile.diff
              });
            } else {
              setActiveDiffFile(null);
            }
          }
        }
      } catch (err) {
        console.error("Falha ao sincronizar arquivos do commit remoto:", err);
      } finally {
        setGithubFilesLoading(false);
      }
    };

    fetchDetail();
  }, [selectedCommitSha, selectedRepoIdSim]);

  // Sync deployment details
  const activeDeployment = serverState.deployments.find((d) => d.id === activeDeploymentId);

  // Trigger manual deployment build via API
  const triggerManualBuild = async () => {
    try {
      const res = await fetch("/api/deployments/trigger", { method: "POST" });
      if (res.ok) {
        const data = await safeJson<any>(res);
        if (data && data.deployment) {
          setActiveDeploymentId(data.deployment.id);
          fetchState(true);
          // Highlight that we triggered build and switched view
          addTerminalLine(`Disparando deploy via CI/CD GitKraken. Status: ${data.deployment.status}, SHA: ${data.deployment.commitHash}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- PREMIUM GITKRAKEN SERVICES: INTERACTIVE SHORTCUTS, UNDO/REDO LOGIC, SYSTEM PUSH/PULL, PUBLIC IMPORT ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + P -> Fuzzy Finder
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsFuzzyFinderOpen((prev) => !prev);
      }
      // Cmd/Ctrl + / -> Help Shortcuts Info
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
      // Cmd/Ctrl + Alt + F -> Focus search gitkraken-filter-input filter
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const filterEl = document.getElementById("gitkraken-filter-input");
        if (filterEl) filterEl.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleUndoCommit = () => {
    const repo = activeSimRepo;
    if (repo.commits.length <= 1) {
      addTerminalLine("Erro: Não há commits adicionais locais para desfazer.");
      return;
    }

    const commitToUndo = repo.commits[0]; // latest commit
    addTerminalLine(`[Undo Action] Desfazendo último commit: "${commitToUndo.message}" [SHA: ${commitToUndo.sha}]`);

    // Remove latest commit, and restore files to modified
    setRepositories((prev) =>
      prev.map((r) => {
        if (r.id !== repo.id) return r;
        return {
          ...r,
          commits: r.commits.slice(1),
          // Set unstaged files back to modified
          unstagedFiles: [
            ...r.unstagedFiles,
            ...(commitToUndo.changes || [
              { filepath: "src/App.tsx", status: "modified", diff: "+ console.log('Simulating restore editing line!')" },
              { filepath: "package.json", status: "modified", diff: "+ \"react\": \"^19.0.1\"" }
            ]).map((file: any) => ({
              filepath: file.filepath,
              status: file.status || "modified",
              content: "",
              originalContent: "",
              diff: file.diff || ""
            }))
          ]
        };
      })
    );

    // Save commit in undone stack
    setUndoneCommitsStack((prev) => {
      const currentStack = prev[repo.id] || [];
      return {
        ...prev,
        [repo.id]: [commitToUndo, ...currentStack]
      };
    });

    // Reset default select sha
    setTimeout(() => {
      setSelectedCommitSha(activeSimRepo.commits[1]?.sha || activeSimRepo.commits[0]?.sha || null);
    }, 40);
  };

  const handleRedoCommit = () => {
    const repo = activeSimRepo;
    const stack = undoneCommitsStack[repo.id] || [];
    if (stack.length === 0) return;

    const commitToRestore = stack[0];
    addTerminalLine(`[Redo Action] Refazendo o commit anteriormente desfeito: "${commitToRestore.message}" [SHA: ${commitToRestore.sha}]`);

    setRepositories((prev) =>
      prev.map((r) => {
        if (r.id !== repo.id) return r;
        return {
          ...r,
          commits: [commitToRestore, ...r.commits],
          // Clear files from unstaged
          unstagedFiles: r.unstagedFiles.filter(f => !(commitToRestore.changes || []).some(tc => tc.filepath === f.filepath))
        };
      })
    );

    setUndoneCommitsStack((prev) => {
      const currentStack = prev[repo.id] || [];
      return {
        ...prev,
        [repo.id]: currentStack.slice(1)
      };
    });

    setTimeout(() => {
      setSelectedCommitSha(commitToRestore.sha);
    }, 40);
  };

  const hasCommitsToUndo = (repoId: string) => {
    const r = repositories.find(repo => repo.id === repoId);
    return r ? r.commits.length > 1 : false;
  };

  const hasCommitsToRedo = (repoId: string) => {
    const stack = undoneCommitsStack[repoId] || [];
    return stack.length > 0;
  };

  const handlePullAction = () => {
    addTerminalLine(">>> git pull origin " + activeSimRepo.activeBranch);
    addTerminalLine("[Sincronização] Coletando updates remotos via GitHub API...");
    addTerminalLine("Conectando a ramificação downstream " + activeSimRepo.activeBranch);
    addTerminalLine("Já está atualizado! (Already up to date).");
    showToast("Pull executado! A árvore local está sincronizada com o HEAD remoto do GitHub.", "success");
  };

  const handlePushAction = () => {
    const unpushedCount = activeSimRepo.commits.filter(c => c.pushed === false).length;

    addTerminalLine(">>> git push origin " + activeSimRepo.activeBranch);
    
    if (unpushedCount === 0) {
      addTerminalLine("Everything up-to-date");
      addTerminalLine("[Sincronização] Todos os commits desta ramificação já estão publicados remotamente.");
      showToast("Tudo atualizado! Todos os seus commits já foram sincronizados com o servidor remoto.", "info");
      return;
    }

    addTerminalLine(`[Sincronização] Preparando delta compactação (pack) para ${unpushedCount} commit(s)...`);
    addTerminalLine(`Gravando objetos de commits locais: 100% (${unpushedCount}/${unpushedCount}), concluído.`);
    addTerminalLine(`Concluído! Enviado commits locais da branch [${activeSimRepo.activeBranch}] para a nuvem.`);
    
    // Marcar commits como publicados
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          commits: repo.commits.map((c) => ({ ...c, pushed: true }))
        };
      })
    );

    showToast(`Push executado com sucesso! ${unpushedCount} commit(s) de simulação foram enviados para a nuvem.`, "success");

    // Trigger local CD webhook build automatically if we are on the connected repo!
    if (serverState.connected && serverState.connectedRepo && `github-${serverState.connectedRepo.id}` === selectedRepoIdSim) {
      addTerminalLine("[CI/CD Pipeline] Webhook interceptado com sucesso! Iniciando compilação de deploy automática...");
      triggerManualBuild();
    }
  };

  const importRepository = async (repoName: string, repoDesc: string) => {
    setIsRepoImportModalOpen(false);
    setImportRepoName("");
    setImportRepoDesc("");

    addTerminalLine(`>>> git clone https://github.com/${repoName}.git`);
    
    // Add temporary loading repository
    const tempId = "imported-" + Date.now();
    const newRepo: GitRepository = {
      id: tempId,
      name: repoName,
      description: repoDesc || `Repositório público importado de https://github.com/${repoName}`,
      activeBranch: "main",
      branches: ["main"],
      tags: [],
      unstagedFiles: [],
      stagedFiles: [],
      stashes: [],
      commits: [
        {
          sha: "loading",
          parents: [],
          message: "Clonando árvore de commits pública de GitHub index server...",
          author: "GitKraken Studio",
          email: "support@gitkraken.com",
          date: "Agora",
          branch: "main"
        }
      ]
    };

    setRepositories(prev => [...prev, newRepo]);
    setSelectedRepoIdSim(tempId);

    // Try fetching from GitHub public API
    try {
      const bRes = await fetch(`https://api.github.com/repos/${repoName}/branches?per_page=15`);
      let branches = ["main"];
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData) && bData.length > 0) {
          branches = bData.map(b => b.name);
        }
      }

      const activeBranch = branches.includes("main") ? "main" : branches.includes("master") ? "master" : branches[0];
      const cRes = await fetch(`https://api.github.com/repos/${repoName}/commits?sha=${activeBranch}&per_page=100`);
      
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData) && cData.length > 0) {
          const commits = cData.map((c: any) => ({
            sha: c.sha.substring(0, 7),
            parents: c.parents.map((p: any) => p.sha.substring(0, 7)),
            message: c.commit.message,
            author: c.commit.author.name,
            email: c.commit.author.email,
            date: new Date(c.commit.author.date).toLocaleDateString("pt-BR"),
            branch: activeBranch,
            avatarUrl: c.author?.avatar_url
          }));

          setRepositories(prev => prev.map(r => {
            if (r.id !== tempId) return r;
            return {
              ...r,
              branches,
              activeBranch,
              commits
            };
          }));
          setSelectedCommitSha(commits[0].sha);
          addTerminalLine(`[Clonagem Kraken] Sincronização Completa de Repositório Público! Carregados ${commits.length} commits históricos e ${branches.length} branches locais.`);
          return;
        }
      }
    } catch (err) {
      console.warn("Public API limit or DNS offline, running detailed simulation fallback.", err);
    }

    // Fallback: Generate a ultra-detailed mock history for this custom repo
    generateMockHistoryForImportedRepo(tempId, repoName, repoDesc);
  };

  const generateMockHistoryForImportedRepo = (id: string, name: string, desc: string) => {
    const isWasm = name.toLowerCase().includes("wasm") || name.toLowerCase().includes("cpp") || name.toLowerCase().includes("rust");
    const authorUser = serverState.user?.name || "Dev Kraken";
    const authorAvatar = serverState.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop";

    const defaultCommits: Commit[] = [
      {
        sha: "e9f8a1",
        parents: ["d3b2c1"],
        message: "Merge branch 'release/v2.1.0' into main",
        author: "Alice (Lead)",
        email: "alice@kraken.io",
        date: "08/06/2026",
        branch: "main",
        isMerge: true,
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop"
      },
      {
        sha: "d3b2c1",
        parents: ["c1a2b3"],
        message: isWasm ? "feat: optimized vector pool cycles and matrix conversions" : "feat: integrated collaborative workspace sockets client",
        author: authorUser,
        email: "dev@kraken.io",
        date: "07/06/2026",
        branch: "feature-refactor",
        avatarUrl: authorAvatar
      },
      {
        sha: "c1a2b3",
        parents: ["b2c3d4"],
        message: "refactor: simplify container compilation configurations",
        author: "Bob (Architect)",
        email: "bob@kraken.io",
        date: "05/06/2026",
        branch: "main",
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop"
      },
      {
        sha: "b2c3d4",
        parents: ["a7f3e8"],
        message: "fix: solve memory leaks occurring on active state transitions",
        author: authorUser,
        email: "dev@kraken.io",
        date: "03/06/2026",
        branch: "feature-refactor",
        avatarUrl: authorAvatar
      },
      {
        sha: "a7f3e8",
        parents: [],
        message: `Initial commit for ${name} framework scaffold`,
        author: "Alice (Lead)",
        email: "alice@kraken.io",
        date: "01/06/2026",
        branch: "main",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop"
      }
    ];

    setRepositories(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        branches: ["main", "feature-refactor"],
        activeBranch: "main",
        commits: defaultCommits,
        unstagedFiles: [
          {
            filepath: "README.md",
            status: "modified",
            content: `# ${name}\n\n${desc || "Clean high-fidelity codebase repository successfully synchronized."}\n\nRunning visual simulation natively.`,
            originalContent: `# ${name}\n\nTemporary scaffold.`,
            diff: `- Temporary scaffold.\n+ ${desc || "Clean high-fidelity codebase repository successfully synchronized."}\n+ Running visual simulation natively.`
          }
        ]
      };
    }));

    addTerminalLine(`[Clonagem Kraken] Sincronização de Repositório Público finalizada com sucesso via motor de simulação de alto desempenho.`);
    setTimeout(() => {
      setSelectedCommitSha("e9f8a1");
    }, 50);
  };

  // Connect Selected GitHub Repo to CI/CD pipeline
  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    const repo = githubRepos.find((r) => r.id === Number(selectedRepoId));
    if (!repo) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/repositories/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, branch: targetBranch }),
      });

      if (res.ok) {
        await fetchState();
        setSelectedRepoId("");
        // Load selected repository name as a live representation in mock Git Kraken list too!
        const newSimRepo: GitRepository = {
          id: `github-${repo.id}`,
          name: repo.name,
          description: repo.description,
          activeBranch: targetBranch,
          branches: [targetBranch, "feat-experimental"],
          tags: [],
          unstagedFiles: [],
          stagedFiles: [],
          stashes: [],
          commits: [
            {
              sha: "gh87f12",
              parents: [],
              message: `Initial synchronized commit from live repository: ${repo.full_name}`,
              author: serverState.user?.name || "Connected Developer",
              email: "support@github.com",
              date: "Today",
              branch: targetBranch,
              avatarUrl: serverState.user?.avatar_url
            }
          ]
        };
        setRepositories((prev) => [newSimRepo, ...prev]);
        setSelectedRepoIdSim(`github-${repo.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Deseja realmente desconectar sua conta GitHub do pipeline?")) return;
    setIsLoading(true);
    try {
      await fetch("/api/repositories/disconnect", { method: "POST" });
      setGithubRepos([]);
      hasFetchedGithubReposRef.current = false;
      setServerState((prev) => ({ ...prev, connected: false, user: null, connectedRepo: null }));
      await fetchState();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalToken) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: personalToken }),
      });

      if (res.ok) {
        setPersonalToken("");
        await fetchState();
      } else {
        const err = await safeJson<any>(res);
        setErrorMessage(err?.error || "Token inválido ou sem autorização.");
      }
    } catch (err) {
      setErrorMessage("Erro ao conectar com API do GitHub.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger manual OAuth Login flow window POPUP
  const handleOAuthLogin = async () => {
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/github/url");
      if (res.ok) {
        const data = await safeJson<any>(res);
        if (data && data.url) {
          const authWindow = window.open(data.url, "github_oauth", "width=600,height=750");
          if (!authWindow) {
            setErrorMessage("Bloqueador de popups detectado! Libere os popups do navegador.");
          }
        }
      }
    } catch (err) {
      setErrorMessage("Chaves do GitHub não configuradas no ambiente OAuth local.");
    }
  };

  // Helper additions for custom terminal outputs
  const addTerminalLine = (text: string) => {
    setTerminalLogs((prev) => [...prev, text]);
  };

  // Stage single file
  const handleStageFile = (filepath: string) => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        const fileToStage = repo.unstagedFiles.find((f) => f.filepath === filepath);
        if (!fileToStage) return repo;

        return {
          ...repo,
          unstagedFiles: repo.unstagedFiles.filter((f) => f.filepath !== filepath),
          stagedFiles: [...repo.stagedFiles, { ...fileToStage }]
        };
      })
    );
    // Sync active diff viewer
    setTimeout(() => refreshActiveDiff(filepath), 10);
  };

  // Unstage single file
  const handleUnstageFile = (filepath: string) => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        const fileToUnstage = repo.stagedFiles.find((f) => f.filepath === filepath);
        if (!fileToUnstage) return repo;

        return {
          ...repo,
          stagedFiles: repo.stagedFiles.filter((f) => f.filepath !== filepath),
          unstagedFiles: [...repo.unstagedFiles, { ...fileToUnstage }]
        };
      })
    );
    setTimeout(() => refreshActiveDiff(filepath), 10);
  };

  // Utility to reload active diff when list updates
  const refreshActiveDiff = (filepath: string) => {
    setRepositories((currentRepos) => {
      const repo = currentRepos.find((r) => r.id === selectedRepoIdSim);
      if (repo) {
        const file = repo.unstagedFiles.find((f) => f.filepath === filepath) ||
                     repo.stagedFiles.find((f) => f.filepath === filepath);
        if (file) {
          setActiveDiffFile(file);
        }
      }
      return currentRepos;
    });
  };

  // Stage All
  const handleStageAll = () => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          stagedFiles: [...repo.stagedFiles, ...repo.unstagedFiles],
          unstagedFiles: []
        };
      })
    );
    addTerminalLine("Adicionando todos os arquivos modificados para o staging index ($ git add .)");
  };

  // Unstage All
  const handleUnstageAll = () => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          unstagedFiles: [...repo.unstagedFiles, ...repo.stagedFiles],
          stagedFiles: []
        };
      })
    );
    addTerminalLine("Retirando todos os arquivos do staging index ($ git reset)");
  };

  // --- BRANCH CONTROL SYSTEMS (SIMULATION HIERARCHY) ---
  const handleCreateBranchSim = (bName: string) => {
    const cleanName = bName.trim().replace(/\s+/g, "-");
    if (!cleanName) return;

    let alreadyExists = false;
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        if (repo.branches.includes(cleanName)) {
          alreadyExists = true;
          return repo;
        }
        return {
          ...repo,
          branches: [...repo.branches, cleanName]
        };
      })
    );

    if (alreadyExists) {
      showToast(`A branch '${cleanName}' já existe.`, "error");
      return;
    }

    addTerminalLine(`>>> git branch ${cleanName}`);
    addTerminalLine(`[Branch Control] Nova branch criada localmente: ${cleanName}`);
    showToast(`Branch '${cleanName}' criada com sucesso!`, "success");
  };

  const handleDeleteBranchSim = (bName: string) => {
    if (activeSimRepo.activeBranch === bName) {
      showToast("Não é possível deletar a branch ativa.", "error");
      return;
    }

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          branches: repo.branches.filter((b) => b !== bName)
        };
      })
    );
    addTerminalLine(`>>> git branch -d ${bName}`);
    addTerminalLine(`[Branch Control] Branch deletada com sucesso: ${bName}`);
    showToast(`Branch '${bName}' removida localmente.`, "success");
  };

  const handleRenameBranchSim = (oldName: string, newName: string) => {
    const cleanName = newName.trim().replace(/\s+/g, "-");
    if (!cleanName || oldName === cleanName) return;

    let alreadyExists = false;
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        if (repo.branches.includes(cleanName)) {
          alreadyExists = true;
          return repo;
        }

        const isCurrentActive = repo.activeBranch === oldName;
        const updatedCommits = repo.commits.map((c) => {
          if (c.branch === oldName) {
            return { ...c, branch: cleanName };
          }
          return c;
        });

        return {
          ...repo,
          branches: repo.branches.map((b) => (b === oldName ? cleanName : b)),
          activeBranch: isCurrentActive ? cleanName : repo.activeBranch,
          commits: updatedCommits
        };
      })
    );

    if (alreadyExists) {
      showToast(`A branch '${cleanName}' já existe neste repositório.`, "error");
      return;
    }

    addTerminalLine(`>>> git branch -m ${oldName} ${cleanName}`);
    addTerminalLine(`[Branch Control] Branch renomeada de "${oldName}" para "${cleanName}"`);
    showToast(`Branch renomeada para '${cleanName}'.`, "success");
  };

  // --- KRAKEN CUSTOM OPERATION HANDLERS & GEMINI CONTROLLERS ---
  const generateAICommitMsg = async () => {
    const filesToUse = [...activeSimRepo.stagedFiles, ...activeSimRepo.unstagedFiles];
    if (filesToUse.length === 0) {
      showToast("Nenhum arquivo modificado encontrado para gerar mensagem de commit.", "info");
      return;
    }
    setIsCommittingAI(true);
    try {
      const response = await fetch("/api/gemini/generate-commit-msg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesToUse.map(f => ({
            filepath: f.filepath,
            status: f.status,
            diff: f.diff || `+ ${f.content}`
          }))
        }),
      });
      const data = await response.json();
      if (data.message) {
        setCommitTitle(data.message.trim());
        addTerminalLine(`[Kraken AI] Mensagem sugerida com sucesso: "${data.message.trim()}"`);
      } else if (data.error) {
        addTerminalLine(`[Kraken AI] Erro ao sugerir mensagem: ${data.error}`);
      }
    } catch (e: any) {
      addTerminalLine(`[Kraken AI] Falha na chamada da API: ${e.message}`);
    } finally {
      setIsCommittingAI(false);
    }
  };

  const handleGitFlowInit = () => {
    addTerminalLine(`>>> git flow init`);
    addTerminalLine(`[Git Design Pattern] Inicializando estrutura Git Flow de ramificações...`);
    
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        const newBranches = [...repo.branches];
        if (!newBranches.includes("develop")) newBranches.push("develop");
        if (!newBranches.includes("master")) newBranches.push("master");
        if (!newBranches.includes("release/v1.3.0")) newBranches.push("release/v1.3.0");
        return {
          ...repo,
          branches: newBranches,
          activeBranch: "develop"
        };
      })
    );
    addTerminalLine(`[Git Flow] Ramificações geradas: master (produção), develop (desenvolvimento), release/v1.3.0 (estágio)`);
    addTerminalLine(`[Git Flow] Checkout automático realizado para ramificação 'develop'.`);
  };

  const [explainingCommitSha, setExplainingCommitSha] = useState<string | null>(null);
  const [commitExplanationResult, setCommitExplanationResult] = useState<string | null>(null);

  const handleExplainCommitWithAI = async (sha: string, msg: string) => {
    setExplainingCommitSha(sha);
    setCommitExplanationResult(null);
    try {
      const response = await fetch("/api/gemini/explain-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha, commitMessage: msg }),
      });
      const data = await response.json();
      if (data.explanation) {
        setCommitExplanationResult(data.explanation);
        addTerminalLine(`[Kraken AI] Explanação do commit ${sha} concluída por nossa Inteligência Artificial.`);
      } else {
        setCommitExplanationResult("Não foi possível gerar uma explicação no momento.");
      }
    } catch (e: any) {
      setCommitExplanationResult(`Erro ao contatar API de IA: ${e.message}`);
    } finally {
      setExplainingCommitSha(null);
    }
  };

  const handleExplainCodeWithAI = async (filename: string, code: string) => {
    setGitLensExplanation("");
    setGitLensExplaining(true);
    try {
      const response = await fetch("/api/gemini/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, code }),
      });
      const data = await response.json();
      if (data.explanation) {
        setGitLensExplanation(data.explanation);
        addTerminalLine(`[GitLens AI] Explicação gerada com sucesso para o arquivo ${filename}`);
      } else {
        setGitLensExplanation("Ocorreu um erro ao obter a explicação do código.");
      }
    } catch (e: any) {
      setGitLensExplanation(`Falha ao contactar servidor de IA: ${e.message}`);
    } finally {
      setGitLensExplaining(false);
    }
  };

  const handleReviewPRWithAI = async (prId: string) => {
    setPullRequests(prev => prev.map(p => {
      if (p.id !== prId) return p;
      return { ...p, reviewLoading: true, reviewMarkdown: "" };
    }));

    const targetPR = pullRequests.find(p => p.id === prId);
    if (!targetPR) return;

    // Direct mockup file diff simulation for testing
    const diffText = `
    File: src/components/Checkout.tsx (modified)
    + const stripe = require('stripe')('sk_live_key');
    + console.log('Secure channel payment token generated!');
    - const stripe = null;
    - console.log('Payment inactive...');
    
    File: package.json (modified)
    +   "version": "1.2.1-beta1",
    +   "dependencies": {
    +     "stripe": "^15.1.0"
    +   }
    -   "version": "1.2.0"
    `;

    try {
      const response = await fetch("/api/gemini/review-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prId,
          title: targetPR.title,
          description: targetPR.description,
          diff: diffText
        }),
      });
      const data = await response.json();
      if (data.review) {
        setPullRequests(prev => prev.map(p => {
          if (p.id !== prId) return p;
          return { ...p, reviewMarkdown: data.review };
        }));
        addTerminalLine(`[Review AI] Revisão de código automatizada do PR #${prId} concluída.`);
      } else {
        setPullRequests(prev => prev.map(p => {
          if (p.id !== prId) return p;
          return { ...p, reviewMarkdown: "Não foi possível gerar a revisão automática no momento." };
        }));
      }
    } catch (e: any) {
      setPullRequests(prev => prev.map(p => {
          if (p.id !== prId) return p;
          return { ...p, reviewMarkdown: `Erro na API AI: ${e.message}` };
      }));
    } finally {
      setPullRequests(prev => prev.map(p => {
        if (p.id !== prId) return p;
        return { ...p, reviewLoading: false };
      }));
    }
  };

  const handleMergeBranchSim = (bName: string) => {
    if (activeSimRepo.activeBranch === bName) {
      showToast("Não é possível mesclar uma ramificação nela mesma.", "error");
      return;
    }

    addTerminalLine(`>>> git merge ${bName}`);
    
    // Check if we are merging feature/payments into main to simulate conflict!
    if (bName === "feature/payments" && activeSimRepo.activeBranch === "main") {
      addTerminalLine(`[Mesclagem] Detetando potenciais conflitos de arquivos...`);
      triggerConflictSimulation();
      return;
    }

    addTerminalLine(`[Mesclagem] Iniciando mesclagem automática de '${bName}' para '${activeSimRepo.activeBranch}'...`);
    
    // Generate code merge commit automatically
    const mergeTitle = `Merge branch '${bName}' into ${activeSimRepo.activeBranch}`;
    const randSha = Math.random().toString(16).substring(2, 8);
    const dateFormatted = new Date().toLocaleDateString("pt-BR");
    const parentSha = activeSimRepo.commits[0]?.sha || "";

    const mergeCommit: Commit = {
      sha: randSha,
      parents: parentSha ? [parentSha] : [],
      message: mergeTitle,
      author: serverState.user?.name || "Alice (Co-Founder)",
      email: serverState.user?.login ? `${serverState.user.login}@git.net` : "alice@dev.local",
      date: dateFormatted,
      branch: activeSimRepo.activeBranch,
      isMerge: true,
      avatarUrl: serverState.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
      pushed: false
    };

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          commits: [mergeCommit, ...repo.commits]
        };
      })
    );

    addTerminalLine(`[Mesclagem] Concluído! Foi criado o commit de mesclagem ${randSha}. Working tree clean.`);
    
    setTimeout(() => {
      setSelectedCommitSha(randSha);
    }, 10);
    
    showToast(`Mesclagem realizada com sucesso! Commit de mesclagem '${mergeTitle}' criado localmente.`, "success");
  };

  // --- INTERACTIVE SCI-FI GIT ENGINE ENHANCEMENTS ---
  const handleCherryPickSim = (commit: Commit) => {
    if (commit.branch === activeSimRepo.activeBranch) {
      showToast("Este commit já está na ramificação ativa.", "error");
      return;
    }

    addTerminalLine(`>>> git cherry-pick ${commit.sha}`);
    addTerminalLine(`[Cherry-Pick] Aplicando mudanças do commit: "${commit.message}"...`);

    const parentSha = activeSimRepo.commits[0]?.sha || "";
    const randSha = Math.random().toString(16).substring(2, 8);
    const dateFormatted = new Date().toLocaleDateString("pt-BR");

    const cherryCommit: Commit = {
      sha: randSha,
      parents: parentSha ? [parentSha] : [],
      message: `cherry-pick: ${commit.message} (from ${commit.sha})`,
      author: serverState.user?.name || "Alice (Co-Founder)",
      email: serverState.user?.login ? `${serverState.user.login}@git.net` : "alice@dev.local",
      date: dateFormatted,
      branch: activeSimRepo.activeBranch,
      avatarUrl: serverState.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
      pushed: false
    };

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          commits: [cherryCommit, ...repo.commits]
        };
      })
    );

    addTerminalLine(`[Cherry-pick] Concluído! O commit de cópia ${randSha} foi integrado à branch ${activeSimRepo.activeBranch}.`);
    
    setTimeout(() => {
      setSelectedCommitSha(randSha);
    }, 10);
    
    showToast(`Commit cherry-picked com sucesso! Criado novo commit '${cherryCommit.message}'.`, "success");
  };

  const handleRevertCommitSim = (commit: Commit) => {
    addTerminalLine(`>>> git revert ${commit.sha}`);
    addTerminalLine(`[Revert] Modificando arquivos para reverter as mudanças de: "${commit.message}"...`);

    const parentSha = activeSimRepo.commits[0]?.sha || "";
    const randSha = Math.random().toString(16).substring(2, 8);
    const dateFormatted = new Date().toLocaleDateString("pt-BR");

    const revertCommit: Commit = {
      sha: randSha,
      parents: parentSha ? [parentSha] : [],
      message: `Revert "${commit.message}"`,
      author: serverState.user?.name || "Alice (Co-Founder)",
      email: serverState.user?.login ? `${serverState.user.login}@git.net` : "alice@dev.local",
      date: dateFormatted,
      branch: activeSimRepo.activeBranch,
      avatarUrl: serverState.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
      pushed: false
    };

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        return {
          ...repo,
          commits: [revertCommit, ...repo.commits]
        };
      })
    );

    addTerminalLine(`[Revert] Concluído sucessivamente! Reversão registrada no commit ${randSha}.`);
    
    setTimeout(() => {
      setSelectedCommitSha(randSha);
    }, 10);
    
    showToast(`Commit revertido com sucesso! Um commit de reversão foi criado.`, "success");
  };

  // --- VISUAL STASH SYSTEM INTERACTIVE CONTROLS ---
  const handleSaveStashSim = () => {
    if (activeSimRepo.unstagedFiles.length === 0 && activeSimRepo.stagedFiles.length === 0) {
      showToast("Você não tem nenhuma modificação unstaged/staged para salvar no stash!", "info");
      return;
    }
    const msg = prompt("Digite uma mensagem descritiva para este stash:", `On ${activeSimRepo.activeBranch}: backup ${new Date().toLocaleTimeString()}`);
    if (msg === null) return;
    
    const filesToStash = [...activeSimRepo.stagedFiles, ...activeSimRepo.unstagedFiles].map(f => ({
      filepath: f.filepath,
      content: f.content,
      status: f.status === "conflict" ? "modified" : f.status
    }));

    const stashObj: Stash = {
      id: `stash_${Math.random().toString(36).substring(2, 7)}`,
      message: msg || `Rascunho temporário de ${activeSimRepo.activeBranch}`,
      files: filesToStash
    };

    setRepositories(prev => prev.map(r => {
      if (r.id !== selectedRepoIdSim) return r;
      return {
        ...r,
        stashes: [stashObj, ...r.stashes],
        stagedFiles: [],
        unstagedFiles: []
      };
    }));

    addTerminalLine(`>>> git stash save "${stashObj.message}"`);
    addTerminalLine(`Modificações guardadas provisoriamente no stash local: [stash@{0}]`);
    showToast(`Modificações salvas com sucesso no Stash!`, "success");
  };

  const handleApplyStashSim = (stashId: string) => {
    const targetStash = activeSimRepo.stashes.find(s => s.id === stashId);
    if (!targetStash) return;

    setRepositories(prev => prev.map(r => {
      if (r.id !== selectedRepoIdSim) return r;
      
      const restoredFiles = targetStash.files.map(sf => {
        return {
          filepath: sf.filepath,
          status: sf.status,
          content: sf.content,
          originalContent: "",
          diff: `+ // Item recuperado do stash stack\n+ ${sf.content}`
        };
      });

      return {
        ...r,
        stashes: r.stashes.filter(s => s.id !== stashId),
        unstagedFiles: [...r.unstagedFiles, ...restoredFiles]
      };
    }));

    addTerminalLine(`>>> git stash pop ${stashId}`);
    addTerminalLine(`Item recuperado do stash stack [${targetStash.message}] com sucesso.`);
    showToast(`Stash aplicado com sucesso na sua árvore de trabalho!`, "success");
  };

  const handleDropStashSim = (stashId: string) => {
    const targetStash = activeSimRepo.stashes.find(s => s.id === stashId);
    if (!targetStash) return;

    setRepositories(prev => prev.map(r => {
      if (r.id !== selectedRepoIdSim) return r;
      return {
        ...r,
        stashes: r.stashes.filter(s => s.id !== stashId)
      };
    }));

    addTerminalLine(`>>> git stash drop ${stashId}`);
    addTerminalLine(`Sucesso! Descartado stash@{${targetStash.message}} da pilha local.`);
    showToast(`Stash '${targetStash.message}' descartado.`, "info");
  };

  const handleSquashCommitSim = (commit: Commit) => {
    const currentBranchCommits = activeSimRepo.commits.filter(c => c.branch === activeSimRepo.activeBranch);
    const indexInBranch = currentBranchCommits.findIndex(c => c.sha === commit.sha);
    
    if (indexInBranch === -1 || indexInBranch === currentBranchCommits.length - 1) {
      showToast("Não há outro commit abaixo na mesma ramificação para esmagar (squash).", "error");
      return;
    }

    const parentCommit = currentBranchCommits[indexInBranch + 1];

    addTerminalLine(`>>> git rebase -i HEAD~2 (Simulando squash)`);
    addTerminalLine(`[Squash] Aglutinando commit "${commit.message}" no commit anterior "${parentCommit.message}"...`);

    const mergedMessage = `${parentCommit.message} + squashed changes: ${commit.message}`;
    
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        const filteredCommits = repo.commits.filter(c => c.sha !== commit.sha && c.sha !== parentCommit.sha);
        
        const squashedCommit: Commit = {
          ...parentCommit,
          sha: parentCommit.sha,
          message: mergedMessage,
          pushed: false
        };

        return {
          ...repo,
          commits: [squashedCommit, ...filteredCommits]
        };
      })
    );

    addTerminalLine(`[Squash] Concluído! Commits combinados localmente no hash [${parentCommit.sha}].`);
    
    setTimeout(() => {
      setSelectedCommitSha(parentCommit.sha);
    }, 10);

    showToast("Squash executado perfeitamente! Os dois commits foram consolidados em um.", "success");
  };

  const handleResetSimAction = (commit: Commit, mode: "hard" | "soft" | "mixed") => {
    const commitSha = commit.sha;
    
    // Check if the target commit is in the current active branch
    const commitExists = activeSimRepo.commits.some(c => c.sha === commitSha);
    if (!commitExists) {
      showToast("O commit alvo não foi encontrado neste repositório simulado.", "error");
      return;
    }

    addTerminalLine(`>>> git reset --${mode} ${commit.sha}`);
    addTerminalLine(`[Reset] Resetando ramificação ativa [${activeSimRepo.activeBranch}] para o commit [${commit.sha}]...`);

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;

        const targetIdx = repo.commits.findIndex(c => c.sha === commitSha);
         if (targetIdx === -1) return repo;

        // Discarded commits on active branch
        const discardedCommits = repo.commits.slice(0, targetIdx).filter(c => c.branch === repo.activeBranch);
        
        // Remove discarded commits
        const updatedCommits = repo.commits.filter(c => {
          const idx = repo.commits.findIndex(x => x.sha === c.sha);
          return !(idx < targetIdx && c.branch === repo.activeBranch);
        });

        // Collect files to restore
        let restoredFiles: FileState[] = [];
        if (mode !== "hard") {
          const seenPaths = new Set<string>();
          discardedCommits.forEach((dc) => {
            if (dc.changes && dc.changes.length > 0) {
              dc.changes.forEach((ch) => {
                if (!seenPaths.has(ch.filepath)) {
                  seenPaths.add(ch.filepath);
                  restoredFiles.push({
                    filepath: ch.filepath,
                    status: ch.status,
                    content: `// Reconstituído por git reset --${mode}\n// Commit de origem: ${dc.sha}\n`,
                    originalContent: "",
                    diff: ch.diff || ""
                  });
                }
              });
            } else {
              const pathMock = `src/restored_${dc.sha}.ts`;
              if (!seenPaths.has(pathMock)) {
                seenPaths.add(pathMock);
                restoredFiles.push({
                  filepath: pathMock,
                  status: "modified",
                  content: `// Alterações resgatadas do commit ${dc.sha}\n// Mensagem: ${dc.message}`,
                  originalContent: "",
                  diff: `+ // Linhas restauradas via reset --${mode}\n`
                });
              }
            }
          });
        }

        let updatedStaged = [...repo.stagedFiles];
        let updatedUnstaged = [...repo.unstagedFiles];

        if (mode === "hard") {
          updatedStaged = [];
          updatedUnstaged = [];
          addTerminalLine("[Reset] Mudanças de workspace e área de staging descartadas (--hard).");
        } else if (mode === "soft") {
          updatedStaged = [...updatedStaged, ...restoredFiles];
          addTerminalLine(`[Reset] Colocando ${restoredFiles.length} arquivo(s) modificado(s) de volta em staging (--soft).`);
        } else {
          updatedUnstaged = [...updatedUnstaged, ...restoredFiles];
          addTerminalLine(`[Reset] Mantendo ${restoredFiles.length} arquivo(s) modificados no diretório de trabalho local (--mixed).`);
        }

        return {
          ...repo,
          commits: updatedCommits,
          stagedFiles: updatedStaged,
          unstagedFiles: updatedUnstaged
        };
      })
    );

    addTerminalLine(`[Reset] Executado! HEAD focado no commit ${commit.sha}.`);
    
    setTimeout(() => {
      setSelectedCommitSha(commit.sha);
    }, 10);

    showToast(`Git reset --${mode} executado para o commit ${commit.sha.substring(0, 7)}!`, "success");
  };

  // Commit changes from box UI
  const handlePerformCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitTitle.trim()) return;

    if (activeSimRepo.stagedFiles.length === 0 && activeSimRepo.unstagedFiles.length > 0) {
      // Auto stage and continue directly
      setRepositories((prev) =>
        prev.map((repo) => {
          if (repo.id !== selectedRepoIdSim) return repo;
          const updatedStaged = [...repo.stagedFiles, ...repo.unstagedFiles];
          return executeCommitOnRepo(repo, updatedStaged, []);
        })
      );
      showToast("Arquivos indexados e commitados com sucesso!", "success");
    } else if (activeSimRepo.stagedFiles.length === 0) {
      showToast("Nenhuma modificação adicionada para incluir no commit!", "info");
      return;
    } else {
      setRepositories((prev) =>
        prev.map((repo) => {
          if (repo.id !== selectedRepoIdSim) return repo;
          return executeCommitOnRepo(repo, repo.stagedFiles, repo.unstagedFiles);
        })
      );
      showToast("Commit criado com sucesso!", "success");
    }
  };

  const executeCommitOnRepo = (repo: GitRepository, staged: FileState[], unstaged: FileState[]) => {
    const parentSha = repo.commits[0]?.sha || "";
    const randSha = Math.random().toString(16).substring(2, 8);
    const dateFormatted = new Date().toLocaleDateString("pt-BR");

    const newCommit: Commit = {
      sha: randSha,
      parents: parentSha ? [parentSha] : [],
      message: commitTitle,
      author: gitConfigName,
      email: gitConfigEmail,
      date: dateFormatted,
      branch: repo.activeBranch,
      avatarUrl: gitConfigAvatar,
      pushed: false
    };

    addTerminalLine(`[Novo Commit Criado] Branch: ${repo.activeBranch}, Mensagem: "${commitTitle}" [SHA: ${randSha}]`);

    // Reset controls
    setCommitTitle("");
    setCommitDesc("");

    const updatedRepo = {
      ...repo,
      commits: [newCommit, ...repo.commits],
      stagedFiles: [],
      unstagedFiles: unstaged
    };

    // Auto-select newly created commit to highlight in graph
    setTimeout(() => {
      setSelectedCommitSha(randSha);
      setActiveDiffFile(null);
    }, 10);

    return updatedRepo;
  };

  // Simulate a Merge Conflict visually immediately!
  const triggerConflictSimulation = () => {
    // Inject conflict in react-ui repo
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== "react-ui-main") return repo;

        const conflictObj: FileState = {
          filepath: "src/hooks/useAuth.ts",
          status: "conflict",
          content: "<<<<<<< HEAD (Ours)\nexport function useAuth() {\n  // Autenticação baseada em Sessão Local SQLite\n  return { user: 'Admin', role: 'SuperUser' };\n}\n=======\nexport function useAuth() {\n  // Autenticação remota baseada em SSO Cloud do Auth0\n  return { user: 'Auth0_User_Session', scopes: ['read', 'write'] };\n}\n>>>>>>> Incoming (feature-payments)",
          originalContent: "export function useAuth() {\n  return null;\n}",
          diff: "@@ -1,3 +1,11 @@\n+<<<<<<< HEAD\n+export function useAuth() {\n+  // Autenticação baseada em Sessão Local SQLite\n+  return { user: 'Admin', role: 'SuperUser' };\n+}\n+=======\n+export function useAuth() {\n+  // Autenticação remota baseada em SSO Cloud do Auth0\n+  return { user: 'Auth0_User_Session', scopes: ['read', 'write'] };\n+}\n+>>>>>>> Incoming",
          conflict: {
            ours: "export function useAuth() {\n  // Autenticação baseada em Sessão Local SQLite\n  return { user: 'Admin', role: 'SuperUser' };\n}",
            theirs: "export function useAuth() {\n  // Autenticação remota baseada em SSO Cloud do Auth0\n  return { user: 'Auth0_User_Session', scopes: ['read', 'write'] };\n}",
            resolved: false
          }
        };

        return {
          ...repo,
          unstagedFiles: [conflictObj, ...repo.unstagedFiles]
        };
      })
    );

    setSelectedRepoIdSim("react-ui-main");
    addTerminalLine("Simulando conflito de mesclagem em: src/hooks/useAuth.ts");
    addTerminalLine("O arquivo foi adicionado à lista de pendências de resolução. Clique nele no painel esquerdo para abrir o Built-in Merge Conflict Editor!");
    
    // Auto scroll view left
    setTimeout(() => {
      const el = activeSimRepo.unstagedFiles.find(f => f.filepath === "src/hooks/useAuth.ts");
      if (el) setActiveDiffFile(el);
    }, 20);
  };

  // Finish conflict resolution logic
  const handleResolveConflictFile = (filepath: string, resolvedContent: string) => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== selectedRepoIdSim) return repo;
        const target = repo.unstagedFiles.find((f) => f.filepath === filepath);
        if (!target) return repo;

        const resolvedFile: FileState = {
          ...target,
          status: "modified",
          content: resolvedContent,
          diff: `+ // Conflito resolvido com sucesso pelo Built-in Merge Conflict Editor\n${resolvedContent.split("\n").map(l => `+ ${l}`).join("\n")}`,
          conflict: {
            ours: target.conflict?.ours || "",
            theirs: target.conflict?.theirs || "",
            resolved: true,
            result: resolvedContent
          }
        };

        return {
          ...repo,
          unstagedFiles: repo.unstagedFiles.filter((f) => f.filepath !== filepath),
          stagedFiles: [...repo.stagedFiles, resolvedFile]
        };
      })
    );

    addTerminalLine(`Conflito resolvido com sucesso para o arquivo: ${filepath}`);
    addTerminalLine(`Você pode agora criar um commit de mesclagem para fechar o ciclo de merge!`);
    setCommitTitle(`Merge branch 'autenticacao' resolvendo conflito em ${filepath.split("/").pop()}`);
    setConflictFile(null);
    setActiveDiffFile(null);
  };

  // Parser command-line interface logic
  const handleCommandLineExec = (line: string) => {
    addTerminalLine(`$ ${line}`);
    const parts = line.trim().split(" ");
    const base = parts[0];

    if (base !== "git") {
      if (line.toLowerCase() === "clear") {
        setTerminalLogs([]);
        return;
      }
      if (line.toLowerCase() === "help") {
        printClippedHelp();
        return;
      }
      addTerminalLine(`Erro: '${line}' não é reconhecido como console Git. Digite 'help' para ver os comandos.`);
      return;
    }

    const command = parts[1];
    if (!command) {
      addTerminalLine("Uso clássico: git <comando> [argumentos]. Digite 'help' para mais.");
      return;
    }

    switch (command) {
      case "status":
        addTerminalLine(`No branch: ${activeSimRepo.activeBranch}`);
        if (activeSimRepo.unstagedFiles.length === 0 && activeSimRepo.stagedFiles.length === 0) {
          addTerminalLine("Nada para commitar, working tree clean.");
        } else {
          if (activeSimRepo.unstagedFiles.length > 0) {
            addTerminalLine("Arquivos modificados (unstaged):");
            activeSimRepo.unstagedFiles.forEach(f => addTerminalLine(`  - [Modificado] ${f.filepath}`));
          }
          if (activeSimRepo.stagedFiles.length > 0) {
            addTerminalLine("Arquivos prontos para commit (staged):");
            activeSimRepo.stagedFiles.forEach(f => addTerminalLine(`  + [Staged] ${f.filepath}`));
          }
        }
        break;

      case "checkout":
        const targetB = parts[2];
        if (!targetB) {
          addTerminalLine("Erro: Especifique a branch desejada. Ex: git checkout feature-payments");
          return;
        }
        if (activeSimRepo.branches.includes(targetB)) {
          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== selectedRepoIdSim) return repo;
              return { ...repo, activeBranch: targetB };
            })
          );
          addTerminalLine(`Switched to branch '${targetB}'`);
        } else {
          // Create new branch if not exist or fail
          addTerminalLine(`Criando nova branch local e alterando o foco: ${targetB}`);
          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== selectedRepoIdSim) return repo;
              return {
                ...repo,
                branches: [...repo.branches, targetB],
                activeBranch: targetB
              };
            })
          );
        }
        break;

      case "add":
        const targetA = parts[2];
        if (targetA === ".") {
          handleStageAll();
        } else if (targetA) {
          handleStageFile(targetA);
        } else {
          addTerminalLine("Defina o parâmetro. Ex: git add .");
        }
        break;

      case "branch":
        const newB = parts[2];
        if (!newB) {
          addTerminalLine("Branches locais:");
          activeSimRepo.branches.forEach(b => addTerminalLine(b === activeSimRepo.activeBranch ? `* ${b}` : `  ${b}`));
        } else {
          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== selectedRepoIdSim) return repo;
              if (repo.branches.includes(newB)) {
                addTerminalLine(`A branch '${newB}' já existe no repositório.`);
                return repo;
              }
              return { ...repo, branches: [...repo.branches, newB] };
            })
          );
          addTerminalLine(`Branch criada: ${newB}`);
        }
        break;

      case "merge":
        const mergeB = parts[2];
        if (!mergeB) {
          addTerminalLine("Erro: insira a branch a ser mesclada.");
          return;
        }
        if (mergeB === "feature-payments" && activeSimRepo.activeBranch === "main") {
          // Trigger the mock merge conflict!
          triggerConflictSimulation();
        } else {
          // Fast-forward merge mock nodes
          addTerminalLine(`Iniciando mesclagem automática da branch ${mergeB} na branch ${activeSimRepo.activeBranch}...`);
          addTerminalLine("Fast-forward: Atualizando apontadores da árvore de commit.");
          addTerminalLine("Mesclagem realizada com sucesso! Sem conflitos de arquivos.");
        }
        break;

      case "commit":
        // Extract message from quotes if present
        const msgMatch = line.match(/-m\s+"([^"]+)"/) || line.match(/-m\s+'([^']+)'/) || line.match(/-m\s+(.+)/);
        const msg = msgMatch ? msgMatch[1] : `Atualizando arquivos locais no branch ${activeSimRepo.activeBranch}`;
        
        if (activeSimRepo.stagedFiles.length === 0 && activeSimRepo.unstagedFiles.length === 0) {
          addTerminalLine("Nada para commitar, working tree clean.");
          return;
        }

        setCommitTitle(msg);
        addTerminalLine(`Iniciando fluxo de commit: "${msg}"...`);
        // We delay slightly to trigger execution block
        setTimeout(() => {
          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== selectedRepoIdSim) return repo;
              const stagedToCommit = repo.stagedFiles.length > 0 ? repo.stagedFiles : repo.unstagedFiles;
              return executeCommitOnRepo(repo, stagedToCommit, repo.stagedFiles.length > 0 ? repo.unstagedFiles : []);
            })
          );
        }, 100);
        break;

      case "stash":
        const subCommand = parts[2];
        if (subCommand === "list") {
          addTerminalLine("Pilha de Rascunhos Virtuais (git stash list):");
          if (activeSimRepo.stashes.length === 0) {
            addTerminalLine("  (sem stashes salvos)");
          } else {
            activeSimRepo.stashes.forEach((st, sIdx) => {
              addTerminalLine(`  stash@{${sIdx}}: ${st.message} [${st.files.length} arquivo(s)]`);
            });
          }
        } else if (subCommand === "pop") {
          if (activeSimRepo.stashes.length === 0) {
            addTerminalLine("Nenhum item em rascunho (stash stack vazio)");
          } else {
            const popped = activeSimRepo.stashes[0];
            setRepositories((prev) =>
              prev.map((repo) => {
                if (repo.id !== selectedRepoIdSim) return repo;
                return {
                  ...repo,
                  stashes: repo.stashes.filter(s => s.id !== popped.id),
                  unstagedFiles: [...repo.unstagedFiles, ...popped.files.map(f => ({
                    filepath: f.filepath,
                    status: f.status,
                    content: f.content,
                    originalContent: "",
                    diff: `+ // Item recuperado do stash stack\n+ ${f.content}`
                  }))]
                };
              })
            );
            addTerminalLine(`Recuperado do stash: stash@{0} (${popped.message})`);
          }
        } else if (subCommand === "clear") {
          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== selectedRepoIdSim) return repo;
              return {
                ...repo,
                stashes: []
              };
            })
          );
          addTerminalLine("Toda a pilha de stashes foi esvaziada localmente.");
        } else {
          // It's git stash or git stash save "message"
          if (activeSimRepo.unstagedFiles.length === 0 && activeSimRepo.stagedFiles.length === 0) {
            addTerminalLine("Nenhuma alteração pendente (staged/unstaged) para guardar.");
          } else {
            let desc = "Work in progress";
            if (parts.length > 2) {
              desc = parts.slice(2).join(" ").replace(/"/g, "").replace(/'/g, "");
            }
            const stashObj: Stash = {
              id: `stash_${Math.random().toString(36).substring(2, 7)}`,
              message: desc,
              files: [...activeSimRepo.stagedFiles, ...activeSimRepo.unstagedFiles].map(f => ({
                filepath: f.filepath,
                content: f.content,
                status: f.status === "conflict" ? "modified" : f.status
              }))
            };
            setRepositories((prev) =>
              prev.map((repo) => {
                if (repo.id !== selectedRepoIdSim) return repo;
                return {
                  ...repo,
                  stashes: [stashObj, ...repo.stashes],
                  stagedFiles: [],
                  unstagedFiles: []
                };
              })
            );
            addTerminalLine(`Modificações salvas com sucesso em stash@{0} [${desc}]`);
          }
        }
        break;

      case "log":
        addTerminalLine("Histórico curto de commits em exibição:");
        activeSimRepo.commits.forEach(c => {
          addTerminalLine(`  * ${c.sha} - ${c.message} - por ${c.author} (${c.date})`);
        });
        break;

      case "reset":
        {
          const resetParam = parts[2] || "";
          let resetMode: "hard" | "soft" | "mixed" = "mixed";
          let shaPart = "";

          if (resetParam === "--hard") {
            resetMode = "hard";
            shaPart = parts[3] || "";
          } else if (resetParam === "--soft") {
            resetMode = "soft";
            shaPart = parts[3] || "";
          } else if (resetParam === "--mixed") {
            resetMode = "mixed";
            shaPart = parts[3] || "";
          } else {
            resetMode = "mixed";
            shaPart = resetParam;
          }

          if (!shaPart) {
            addTerminalLine("Erro: Informe o commit SHA ou 'HEAD~1' para redefinir. Ex: git reset --hard <sha>");
            break;
          }

          let matchedCommit: Commit | undefined;
          if (shaPart.toUpperCase().startsWith("HEAD~")) {
            const depth = parseInt(shaPart.replace(/HEAD~/i, "")) || 0;
            const currentBranchCommits = activeSimRepo.commits.filter(c => c.branch === activeSimRepo.activeBranch);
            if (depth >= 0 && depth < currentBranchCommits.length) {
              matchedCommit = currentBranchCommits[depth];
            } else {
              addTerminalLine(`Erro: Não foi possível resolver o ancestral HEAD~${depth} nesta branch.`);
              break;
            }
          } else {
            matchedCommit = activeSimRepo.commits.find(c => c.sha.toLowerCase().startsWith(shaPart.toLowerCase()));
          }

          if (!matchedCommit) {
            addTerminalLine(`Erro: Commit '${shaPart}' não localizado.`);
            break;
          }

          // Trigger simulator reset asynchronously or synchronously
          handleResetSimAction(matchedCommit, resetMode);
        }
        break;

      case "push":
        handlePushAction();
        break;

      case "pull":
        handlePullAction();
        break;

      case "shortlog":
        {
          const counts: Record<string, number> = {};
          activeSimRepo.commits.forEach(c => {
            const authorKey = c.author || "Desenvolvedor Desconhecido";
            counts[authorKey] = (counts[authorKey] || 0) + 1;
          });
          addTerminalLine("Contribuições da Equipe (git shortlog -sn):");
          addTerminalLine("----------------------------------------");
          Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([author, count]) => {
              addTerminalLine(`  ${count.toString().padStart(4, " ")}  commits de ${author}`);
            });
          addTerminalLine("----------------------------------------");
        }
        break;

      case "team":
      case "collaborators":
      case "colaboradores":
      case "equipe":
        {
          addTerminalLine("Equipe de Desenvolvimento e Colaboradores Ativos:");
          addTerminalLine("=========================================");
          const team = [
            { name: "Alice", role: "Co-Founder & Lead Engineer", email: "alice@git.local", commitsCount: activeSimRepo.commits.filter(c => c.author.includes("Alice")).length },
            { name: "Bob", role: "Principal Systems Architect", email: "bob@git.local", commitsCount: activeSimRepo.commits.filter(c => c.author.includes("Bob")).length },
            { name: "Carol", role: "Senior Frontend Engineer", email: "carol@git.local", commitsCount: activeSimRepo.commits.filter(c => c.author.includes("Carol")).length }
          ];
          
          team.unshift({
            name: gitConfigName,
            role: "Configuração Git Ativa (Você)",
            email: gitConfigEmail,
            commitsCount: activeSimRepo.commits.filter(c => c.author === gitConfigName).length
          });

          team.forEach((member) => {
            addTerminalLine(` • ${member.name.padEnd(20, " ")} | Cargo: ${member.role.padEnd(28, " ")} | Contato: <${member.email}> (${member.commitsCount} commits na active branch)`);
          });
          addTerminalLine("=========================================");
        }
        break;

      default:
        {
          const lowerCmd = command.toLowerCase();
          if (lowerCmd === "remote") {
            addTerminalLine("origin  https://github.com/kraken-org/react-ui.git (fetch)");
            addTerminalLine("origin  https://github.com/kraken-org/react-ui.git (push)");
          } else if (lowerCmd === "clone") {
            const cloneFolder = parts[2] || "repositorio-copia";
            addTerminalLine(`Clonando em '${cloneFolder}'...`);
            addTerminalLine("remote: Enumerating objects: 1045, done.");
            addTerminalLine("remote: Counting objects: 100% (1045/1045), done.");
            addTerminalLine("remote: Compressing objects: 100% (812/812), done.");
            addTerminalLine("Receiving objects: 100% (1045/1045), 2.45 MB / 4.88 MB/s, done.");
            addTerminalLine("Resolving deltas: 100% (456/456), done.");
            addTerminalLine(`Sucesso! Repositório local clonado na pasta ./${cloneFolder}`);
          } else if (lowerCmd === "fetch") {
            addTerminalLine("Buscando atualizações de remoto (origin)...");
            addTerminalLine("From https://github.com/kraken-org/react-ui");
            addTerminalLine("  * [new branch]      feature-analytics -> origin/feature-analytics");
            addTerminalLine("  * [new branch]      staging           -> origin/staging");
            addTerminalLine("Sucesso! Referências virtuais e ramificações remotas sincronizadas localmente.");
          } else if (lowerCmd === "diff") {
            addTerminalLine("Comparando árvore de arquivos ativa contra HEAD...");
            if (activeSimRepo.unstagedFiles.length === 0 && activeSimRepo.stagedFiles.length === 0) {
              addTerminalLine("Nenhuma diferença pendente localmente (working tree clean).");
            } else {
              const file = activeSimRepo.unstagedFiles[0] || activeSimRepo.stagedFiles[0];
              addTerminalLine(`diff --git a/${file.filepath} b/${file.filepath}`);
              addTerminalLine("index d28b813..fd170a3 100644");
              addTerminalLine(`--- a/${file.filepath}`);
              addTerminalLine(`+++ b/${file.filepath}`);
              const diffText = file.diff?.substring(0, 150) || "+ // Linhas adicionadas no arquivo\n+ console.log(\"Alterado via CLI integrativa\");";
              addTerminalLine(diffText);
            }
          } else if (lowerCmd === "tag") {
            const tagName = parts[2];
            if (!tagName) {
              addTerminalLine("Tags registradas no repositório:");
              addTerminalLine("  v1.0.0");
              addTerminalLine("  v1.1.0-rc1");
              addTerminalLine("  v1.2.0-stable");
            } else {
              addTerminalLine(`Tag '${tagName}' aplicada com sucesso ao commit HEAD [${activeSimRepo.commits[0]?.sha || "d819d1"}].`);
              addTerminalLine("Dica: Use 'git push --tags' para enviar tags virtuais para o remoto.");
            }
          } else if (lowerCmd === "blame") {
            const targetFile = parts[2] || "src/App.tsx";
            addTerminalLine(`git blame ${targetFile}:`);
            addTerminalLine(`  d130bef (${serverState.user?.name || "Alice"} (You) 2026-06-08 1) import React, { useState } from 'react';`);
            addTerminalLine("  440b4a5 (Carol (Developer)              2026-06-07 2) export function startGitApp() {");
            addTerminalLine("  f506233 (Bob (Architect)                2026-06-06 3)   console.log(\"Git Kraken Engine running...\");");
            addTerminalLine("  82cd600 (Alice                          2026-06-05 4) }");
          } else if (lowerCmd === "show") {
            const showSha = parts[2] || (activeSimRepo.commits[0]?.sha || "d819d1");
            const matchedComm = activeSimRepo.commits.find(c => c.sha.toLowerCase().startsWith(showSha.toLowerCase())) || activeSimRepo.commits[0];
            addTerminalLine(`commit ${matchedComm?.sha || "d819d1"}`);
            addTerminalLine(`Author: ${matchedComm?.author || "Developer"} <dev@kraken-org.local>`);
            addTerminalLine(`Date:   ${matchedComm?.date || "2026-06-08"}`);
            addTerminalLine("");
            addTerminalLine(`    ${matchedComm?.message || "Mensagem de commit simulado"}`);
            addTerminalLine("");
            addTerminalLine("diff --git a/src/App.tsx b/src/App.tsx");
            addTerminalLine("@@ -10,3 +10,5 @@");
            addTerminalLine("+ // Detalhes do commit exibidos por git show");
          } else if (lowerCmd === "reflog") {
            addTerminalLine("Reflog da ramificação ativa:");
            activeSimRepo.commits.slice(0, 5).forEach((c, idx) => {
              addTerminalLine(`  ${c.sha} HEAD@{${idx}}: commit: ${c.message}`);
            });
            addTerminalLine("  df12876 HEAD@{5}: checkout: moving from main to feature-payments");
          } else if (lowerCmd === "config") {
            addTerminalLine("Configurações virtuais locais do Git:");
            addTerminalLine(`  user.name=${gitConfigName}`);
            addTerminalLine(`  user.email=${gitConfigEmail}`);
            addTerminalLine("  core.editor=code-editor");
            addTerminalLine("  color.ui=true");
            addTerminalLine("  core.autocrlf=input");
          } else if (lowerCmd === "rm") {
            const fileRm = parts[2];
            if (!fileRm) {
              addTerminalLine("Erro: Especifique o arquivo para remover. Ex: git rm src/utils.ts");
            } else {
              addTerminalLine(`rm '${fileRm}'`);
              addTerminalLine(`Sucesso! Arquivo '${fileRm}' marcado para remoção.`);
            }
          } else if (lowerCmd === "clean") {
            addTerminalLine("Limpando arquivos não rastreados do working tree...");
            addTerminalLine("Removing build/tmp_cache.log");
            addTerminalLine("Removing public/test_draft.png");
            addTerminalLine("Sucesso! Diretório de trabalho local limpo.");
          } else {
            // General catch-all mock execution for ALL git commands
            const fullArgs = parts.slice(2).join(" ");
            const formatArgs = fullArgs ? ` com argumentos: "${fullArgs}"` : "";
            addTerminalLine(`[Simulador Git - OK] Comando 'git ${command}' reconhecido e executado virtualmente.`);
            addTerminalLine(`Branch ativa: [${activeSimRepo.activeBranch}]`);
            addTerminalLine(`Ação simulada com sucesso${formatArgs}. O estado atual da árvore de commits local permanece seguro.`);
          }
        }
        break;
    }
  };

  const printClippedHelp = () => {
    addTerminalLine("Guia de Instruções CLI do Git Kraken:");
    addTerminalLine("  git status            - Informa as modificações em staging e no working tree");
    addTerminalLine("  git add <arquivo>     - Adiciona a modificação do arquivo no estágio");
    addTerminalLine("  git add .             - Adiciona todas as modificações no estágio");
    addTerminalLine("  git commit -m \"msg\"   - Gera um commit incluindo as modificações ativas");
    addTerminalLine("  git branch <nome>     - Cria uma ramificação com o nome fornecido");
    addTerminalLine("  git checkout <nome>   - Alterna para o ramificação selecionada");
    addTerminalLine("  git merge <branch>    - Mescla arquivos (experimente feature-payments para conflitos)");
    addTerminalLine("  git reset --hard <sha> - Restaura HEAD, apagando mudanças da staging e do workspace");
    addTerminalLine("  git reset --soft <sha> - Restaura HEAD, salvando mudanças como staged (em staging)");
    addTerminalLine("  git reset [sha]       - Restaura HEAD, salvando mudanças como unstaged (padrão)");
    addTerminalLine("  git push              - Envia os commits locais para o repositório remoto");
    addTerminalLine("  git pull              - Busca e mescla os updates de ramificação do canal remoto");
    addTerminalLine("  git shortlog -sn      - Exibe ranking de commits por desenvolvedores da equipe");
    addTerminalLine("  git team              - Exibe a lista completa de colaboradores ativos no projeto");
    addTerminalLine("  git stash / stash pop - Guarda/Recupera rascunhos de arquivos temporários");
    addTerminalLine("  git log --oneline     - Exibe lista resumida das ramificações de commits");
    addTerminalLine("  Soporte dinâmico total: Qualquer outro comando Git (como remote, tag, show, reflog, clone, blame, config, rm, clean, etc.) é totalmente aceito e simulado dinamicamente com respostas realistas!");
    addTerminalLine("  clear                 - Limpa este terminal de visualização de logs");
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 font-sans selection:bg-indigo-500 selection:text-white ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-[#090b11] text-slate-100"}`}>
      
      {/* Visual Navigation Header */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-xl ${isLightTheme ? "bg-white/80 border-slate-200" : "bg-[#0c0f17]/90 border-slate-850"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center">
              <Github className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-white flex items-center gap-2">
                GitKraken Client Studio <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 bg-indigo-950 border border-indigo-900 rounded-full font-bold text-indigo-400">PREMIUM GUI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View switcher tabs */}
            <div className={`flex rounded-xl p-1 text-xs font-semibold select-none ${isLightTheme ? "bg-slate-200" : "bg-slate-900"}`}>
              <button
                onClick={() => setActiveTab("gitkraken")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "gitkraken"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <GitFork className="h-3.5 w-3.5" /> Workspace GitKraken
              </button>
              <button
                onClick={() => setActiveTab("gitdeploy")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "gitdeploy"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <Server className="h-3.5 w-3.5" /> CI/CD Integrado
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Gráficos & Métricas
              </button>
            </div>

            {/* Dark & Light Theme Switcher */}
            <button
              onClick={() => setIsLightTheme(!isLightTheme)}
              className={`p-2 rounded-xl border transition ${isLightTheme ? "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100"}`}
              title="Alternar Tema visual"
            >
              {isLightTheme ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">

        {/* --- TAB A: GITKRAKEN CLIENT CLIENT WORKSPACE --- */}
        {activeTab === "gitkraken" && (
          <div className={`rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all duration-300 w-full ${
            isLightTheme 
              ? "bg-slate-100 border-slate-300 shadow-slate-200" 
              : "bg-[#0b0e14] border-slate-800/80 shadow-black/80"
          }`}>
            
            {/* macOS style Window Header & Menu Buttons */}
            <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
              isLightTheme ? "bg-slate-200/60 border-slate-300" : "bg-[#0f141d] border-slate-850"
            }`}>
              
              {/* Apple macOS Traffic Lights Controls */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 select-none shrink-0">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer block hover:brightness-75 transition-all"></span>
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#df9d24] cursor-pointer block hover:brightness-75 transition-all"></span>
                  <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1a9c2b] cursor-pointer block hover:brightness-75 transition-all"></span>
                </div>
                
                {/* Current Repo name and status */}
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono tracking-widest px-2.5 py-0.5 rounded-md font-bold ${
                    selectedRepoIdSim.startsWith("github-")
                      ? "bg-indigo-950/80 border border-indigo-900/60 text-indigo-400"
                      : selectedRepoIdSim.startsWith("imported-")
                        ? "bg-emerald-950/80 border border-emerald-900/60 text-emerald-400"
                        : "bg-teal-950/80 border border-teal-900/60 text-teal-400"
                  }`}>
                    {selectedRepoIdSim.startsWith("github-") ? "Real GitHub" : selectedRepoIdSim.startsWith("imported-") ? "Cloned" : "Local Sim"}
                  </span>
                  <span className={`text-xs font-bold font-mono tracking-wide ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                    {activeSimRepo.name}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-light ${
                    isLightTheme ? "bg-slate-300/60 text-slate-600" : "bg-slate-900 text-slate-400"
                  }`}>
                    ref: {activeSimRepo.activeBranch}
                  </span>
                </div>
              </div>

              {/* Advanced Top Horizontal Tool Actions Panel */}
              <div className="flex items-center flex-wrap gap-2">
                
                {/* Undo action button */}
                <button
                  type="button"
                  onClick={handleUndoCommit}
                  disabled={!hasCommitsToUndo(selectedRepoIdSim)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    hasCommitsToUndo(selectedRepoIdSim)
                      ? isLightTheme
                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white"
                      : "opacity-40 cursor-not-allowed border-transparent text-slate-500"
                  }`}
                  title="Desfazer Último Commit (Undo Ctrl+Z equivalent)"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span>Undo</span>
                  {hasCommitsToUndo(selectedRepoIdSim) && (
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                      {activeSimRepo.commits.length - 1}
                    </span>
                  )}
                </button>

                {/* Redo action button */}
                <button
                  type="button"
                  onClick={handleRedoCommit}
                  disabled={!hasCommitsToRedo(selectedRepoIdSim)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    hasCommitsToRedo(selectedRepoIdSim)
                      ? isLightTheme
                        ? "bg-white border-slate-205 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-900 border-slate-800 text-slate-202 text-slate-200 hover:bg-slate-850"
                      : "opacity-40 cursor-not-allowed border-transparent text-slate-500"
                  }`}
                  title="Refazer Commit Desfeito (Redo)"
                >
                  <span>Redo</span>
                  {hasCommitsToRedo(selectedRepoIdSim) && (
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                      {undoneCommitsStack[selectedRepoIdSim]?.length || 0}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>

                <div className={`h-4 w-[1px] ${isLightTheme ? "bg-slate-300" : "bg-slate-800"}`} />

                {/* Pull Sincronização */}
                <button
                  type="button"
                  onClick={handlePullAction}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    isLightTheme
                      ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      : "bg-[#181d26] border-slate-800 text-slate-300 hover:bg-slate-850"
                  }`}
                  title="Atrair alterações do HEAD remoto (Pull)"
                >
                  <ArrowDown className="h-4 w-4 text-sky-400 animate-bounce" />
                  <span>Pull</span>
                </button>

                {/* Push Sincronização */}
                <button
                  type="button"
                  onClick={handlePushAction}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    isLightTheme
                      ? "bg-white border-slate-205 text-slate-700 hover:bg-slate-100"
                      : "bg-[#181d26] border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-slate-105"
                  }`}
                  title="Enviar alterações locais para a nuvem GitHub (Push)"
                >
                  <ArrowUp className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span>Push</span>
                </button>

                <div className={`h-4 w-[1px] ${isLightTheme ? "bg-slate-300" : "bg-slate-800"}`} />

                {/* Open Fuzzy Finder Button */}
                <button
                  type="button"
                  onClick={() => setIsFuzzyFinderOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white text-xs font-semibold cursor-pointer transition shadow shadow-indigo-600/10"
                  title="Pesquisa Avançada (Fuzzy Finder CommandLine) [Cmd/Ctrl+P]"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Fuzzy Finder</span>
                  <kbd className="text-[9px] bg-indigo-950 text-indigo-400 px-1 rounded font-mono font-bold tracking-wide select-none">⌘P</kbd>
                </button>

                {/* Import Public Git Button */}
                <button
                  type="button"
                  onClick={() => setIsRepoImportModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    isLightTheme
                      ? "bg-emerald-50 border-emerald-250 text-emerald-850 hover:bg-emerald-100"
                      : "bg-[#10241b] border-emerald-900/40 text-emerald-300 hover:bg-[#153124]"
                  }`}
                  title="Clonar outro repositório público do GitHub instantaneamente"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Clonar Repo</span>
                </button>

                {/* Help dropdown toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsHelpDropdownOpen(!isHelpDropdownOpen)}
                    className={`p-1.5 rounded-lg border transition ${
                      isLightTheme ? "bg-slate-50 hover:bg-slate-205 border-slate-300 text-slate-600" : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>

                  {isHelpDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl border p-2 z-50 shadow-2xl ${
                      isLightTheme ? "bg-white border-slate-200 text-slate-700" : "bg-[#0f1422] border-slate-805"
                    }`}>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#a8a19b] p-2 block font-bold border-b border-slate-800 mb-1.5">Ações Rápidas</span>
                      <button
                        type="button"
                        onClick={() => { setIsShortcutsOpen(true); setIsHelpDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition cursor-pointer`}
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span>Ver Teclas de Atalho</span>
                        <kbd className="text-[9px] ml-auto p-0.5 px-1 bg-slate-950 text-indigo-400 rounded">⌘/</kbd>
                      </button>
                      <button
                        type="button"
                        onClick={() => { printClippedHelp(); setIsHelpDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition cursor-pointer`}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Exibir Instruções no CLI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTerminalLogs([]); setIsHelpDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-lg text-xs hover:bg-rose-955 hover:text-rose-300 flex items-center gap-2 transition cursor-pointer`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>Limpar Logs do Terminal</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Premium Workspace Context Info & Git-Provider Bar */}
            <div className={`px-4 py-2.5 border-b flex flex-col lg:flex-row items-center justify-between gap-3 select-none text-xs ${
              isLightTheme ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-[#101521] border-slate-850/80 text-slate-300"
            }`}>
              {/* Left Side: Repo and Active Context Details */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] w-full lg:w-auto">
                <span className="font-semibold text-slate-400">Contexto:</span>
                <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                  isLightTheme ? "bg-slate-200/80 text-slate-800" : "bg-slate-900 text-slate-200"
                }`}>📂 {activeSimRepo.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-indigo-500 font-bold flex items-center gap-1">⌥ {activeSimRepo.activeBranch}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-400">HEAD commit: <span className="text-amber-500 font-semibold font-mono">{activeSimRepo.commits[0]?.sha || "7c766e"}</span></span>
                
                {jiraIssues.find(iss => activeSimRepo.activeBranch?.toLowerCase().includes(iss.id.toLowerCase())) && (
                  <span className="ml-1.5 bg-sky-950/70 border border-sky-850 text-sky-400 px-2.5 py-0.5 rounded-full text-[10px] animate-pulse flex items-center gap-1 font-bold">
                    <CheckSquare className="h-3 w-3 text-sky-450" /> Jira: {jiraIssues.find(iss => activeSimRepo.activeBranch?.toLowerCase().includes(iss.id.toLowerCase()))?.id}
                  </span>
                )}
                {selectedRepoIdSim.startsWith("github-") && (
                  <div className="flex items-center gap-1 text-indigo-400 font-bold ml-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500 animate-spin" />
                    <span>Sincronizado API Github</span>
                  </div>
                )}
              </div>

              {/* Right Side: Compact Active Provider Selector */}
              <div className="flex items-center gap-3.5 flex-wrap justify-between lg:justify-end w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#a8a19b] font-bold">Provedor Git:</span>
                  <div className={`flex p-0.5 rounded-lg border text-[10px] ${
                    isLightTheme ? "bg-slate-200/60 border-slate-300" : "bg-slate-950/60 border-slate-850"
                  }`}>
                    {[
                      { id: "github", label: "GitHub", color: "bg-indigo-600 border-indigo-500 text-white" },
                      { id: "gitlab", label: "GitLab", color: "bg-orange-600 border-orange-500 text-white" },
                      { id: "bitbucket", label: "Bitbucket", color: "bg-blue-600 border-blue-500 text-white" },
                      { id: "azure", label: "Azure DevOps", color: "bg-sky-600 border-sky-400 text-white" },
                      { id: "selfhosted", label: "Self-Hosted", color: "bg-purple-600 border-purple-500 text-white" }
                    ].map(prov => {
                      const isActive = activeGitProvider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => {
                            setActiveGitProvider(prov.id as any);
                            addTerminalLine(`[Provider Context] Alterando provedor Git ativo para: ${prov.label}`);
                          }}
                          className={`px-2 py-0.5 rounded font-mono font-bold transition cursor-pointer text-[10px] ${
                            isActive
                              ? `${prov.color} shadow-sm`
                              : isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-100"
                          }`}
                        >
                          {prov.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-slate-500 uppercase">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    activeGitProvider === "github" ? "bg-indigo-500" :
                    activeGitProvider === "gitlab" ? "bg-orange-500" :
                    activeGitProvider === "bitbucket" ? "bg-blue-500" : "bg-purple-500"
                  } animate-pulse`} />
                  <span>SECURE CONNECT</span>
                </div>
              </div>
            </div>

            {/* Premium Workspace Tab Navigation Bar (IDE-Style, No Wrapping, Horizontal Slider Scroll) */}
            <div className={`border-b select-none overflow-x-auto ${
              isLightTheme ? "bg-slate-50 border-slate-205" : "bg-[#0c101a] border-slate-850/70"
            }`}>
              <div className="flex items-center min-w-[750px] px-1">
                {[
                  { id: "explorer", label: "Grafo de Commits", icon: <GitFork className="h-4 w-4" /> },
                  { id: "prs", label: "Pull Requests", icon: <GitPullRequest className="h-4 w-4" />, badge: pullRequests.filter(p => p.status === "Open").length },
                  { id: "jira", label: "Integração Jira Software", icon: <CheckSquare className="h-4 w-4" /> },
                  { id: "gitlens", label: "GitLens AI Correções", icon: <Sparkles className="h-4 w-4 text-amber-500" /> },
                  { id: "worktrees", label: "Worktrees & Insights", icon: <Layers className="h-4 w-4" /> }
                ].map(tab => {
                  const isActive = krakenSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setKrakenSubTab(tab.id as any);
                        addTerminalLine(`[Tab Workspace] Navegando para a seção: ${tab.label}`);
                      }}
                      className={`relative py-3 px-5 font-bold text-xs flex items-center gap-2 transition cursor-pointer border-r ${
                        isActive
                          ? isLightTheme 
                            ? "text-indigo-600 bg-white border-r-slate-200" 
                            : "text-indigo-400 bg-[#121724] border-r-slate-850"
                          : isLightTheme 
                            ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border-r-slate-200" 
                            : "text-slate-400 hover:text-white hover:bg-[#0f1420]/55 border-r-slate-850"
                      }`}
                    >
                      {tab.icon}
                      <span className="tracking-wide">{tab.label}</span>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="text-[10px] bg-rose-600 text-white font-mono rounded-full px-1.5 py-0.2 animate-pulse font-bold">
                          {tab.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outer layout wrapper grid containing Tree Sidebar & Main Graph Visualizer panels */}
            {krakenSubTab === "explorer" && (
              <DraggableDashboard
                isLightTheme={isLightTheme}
                sidebar={
                  <div className="flex flex-col space-y-6 h-full p-2">
              
              {/* Repo Selector simulated card wrapper */}
              <div className={`p-5 rounded-2xl border ${isLightTheme ? "bg-white border-slate-200 shadow-md" : "bg-slate-900 border-slate-850 shadow-xl"}`}>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/60 mb-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4.5 w-4.5 text-indigo-400" />
                    <span className="text-xs uppercase font-mono tracking-widest font-bold text-slate-300">
                      Repositório do Workspace
                    </span>
                  </div>
                  {/* Status online light */}
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">Simulando</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <select
                      value={selectedRepoIdSim}
                      onChange={(e) => setSelectedRepoIdSim(e.target.value)}
                      className={`w-full text-xs px-3.5 py-3 rounded-xl border outline-none appearance-none tracking-wide pr-8 ${isLightTheme ? "bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500" : "bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500"}`}
                    >
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.id}>
                          📂 {repo.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-light font-mono">
                    {activeSimRepo.description}
                  </p>
                </div>
              </div>

              {/* Simulated Git Objects rail: local/remote branches, tags, conflict helper button launcher */}
              <div className={`p-5 rounded-2xl border flex-1 flex flex-col space-y-5 ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}>
                
                {/* Branches Local */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">
                      Branches Locais ({activeSimRepo.branches.length})
                    </span>
                    <button
                      onClick={() => {
                        const name = prompt("Digite o nome da nova branch (ex: feature/checkout):");
                        if (name && name.trim()) {
                          handleCreateBranchSim(name.trim());
                        }
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/60 px-2 py-0.5 rounded cursor-pointer transition"
                    >
                      <Plus className="h-3 w-3" /> Nova
                    </button>
                  </div>
                  <div className="space-y-1">
                    {activeSimRepo.branches.map((bName) => {
                      const isActive = activeSimRepo.activeBranch === bName;
                      const config = getBranchColorClass(bName);
                      return (
                        <div
                          key={bName}
                          onClick={() => {
                            setRepositories((prev) =>
                              prev.map((r) => {
                                if (r.id !== selectedRepoIdSim) return r;
                                return { ...r, activeBranch: bName };
                              })
                            );
                            addTerminalLine(`Alterando branch focada para: ${bName}`);
                            if (selectedRepoIdSim.startsWith("github-")) {
                              const gitRepoId = Number(selectedRepoIdSim.replace("github-", ""));
                              const realRepo = githubRepos.find((r) => r.id === gitRepoId);
                              if (realRepo) {
                                fetchGitHubCommitsForBranch(realRepo.full_name, bName);
                              }
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            isActive
                              ? "bg-indigo-950/45 border-indigo-900/60 text-slate-100 font-bold"
                              : "hover:bg-slate-950 border-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GitBranch className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-indigo-400 animate-pulse" : "text-slate-600"}`} />
                            <span className="truncate max-w-[110px] font-mono shrink-0">{bName}</span>
                          </div>
                          
                          {isActive ? (
                            <span className="text-[9px] font-mono tracking-widest font-semibold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 uppercase shrink-0">
                              head
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Merge Action */}
                              <button
                                onClick={() => handleMergeBranchSim(bName)}
                                title={`Mesclar '${bName}' em '${activeSimRepo.activeBranch}'`}
                                className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30 rounded transition cursor-pointer"
                              >
                                <GitPullRequest className="h-3.5 w-3.5" />
                              </button>

                              {/* Rename Action */}
                              <button
                                onClick={() => {
                                  const renameVal = prompt(`Renomear ramificação "${bName}" para:`, bName);
                                  if (renameVal && renameVal.trim() && renameVal.trim() !== bName) {
                                    handleRenameBranchSim(bName, renameVal.trim());
                                  }
                                }}
                                title="Renomear branch"
                                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-amber-950/30 rounded transition cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDeleteBranchSim(bName)}
                                title="Deletar branch"
                                className="p-1 text-slate-500 hover:text-rose-450 hover:bg-rose-955/30 rounded transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STASH STACK WIDGET */}
                <div className="pt-3 border-t border-slate-900 select-none">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#10b981] font-bold flex items-center gap-1.5">
                      <Layers className="h-3 w-3" /> Stashes de Rascunho ({activeSimRepo.stashes?.length || 0})
                    </span>
                    <button
                      onClick={handleSaveStashSim}
                      className="text-[10px] text-[#10b981] hover:text-emerald-450 font-bold flex items-center gap-1 bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/35 px-2 py-0.5 rounded cursor-pointer transition"
                      title="Salva modificações atuais no stash ($ git stash)"
                    >
                      <Plus className="h-2.5 w-2.5" /> Stash
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {(!activeSimRepo.stashes || activeSimRepo.stashes.length === 0) ? (
                      <p className="text-[10px] text-slate-500 font-light italic text-center py-2 bg-slate-950/20 border border-slate-950/40 rounded-lg">
                        Nenhum rascunho guardado (use git stash)
                      </p>
                    ) : (
                      activeSimRepo.stashes.map((st, sIdx) => (
                        <div
                          key={st.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-[11px] transition ${
                            isLightTheme ? "bg-white border-slate-200" : "bg-slate-950/40 border-transparent hover:border-slate-800"
                          }`}
                        >
                          <div className="min-w-0 flex flex-col font-sans">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-emerald-500 font-bold text-[9px]">stash@&#123;{sIdx}&#125;</span>
                              <span className={`font-semibold truncate max-w-[110px] ${isLightTheme ? "text-slate-700" : "text-slate-300"}`} title={st.message}>
                                {st.message}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {st.files.length} {st.files.length === 1 ? "arquivo" : "arquivos"} modificados
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {/* POP / APPLY */}
                            <button
                              onClick={() => handleApplyStashSim(st.id)}
                              title="Aplicar e remover da pilha (git stash pop)"
                              className="p-1 hover:text-emerald-400 hover:bg-emerald-950/25 rounded transition cursor-pointer text-slate-400"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            
                            {/* DROP */}
                            <button
                              onClick={() => handleDropStashSim(st.id)}
                              title="Deletar rascunho (git stash drop)"
                              className="p-1 hover:text-rose-455 hover:bg-rose-955/25 rounded transition cursor-pointer text-slate-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Conflict simulator visual launcher badge */}
                <div className="pt-2">
                  <button
                    onClick={triggerConflictSimulation}
                    className="w-full bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 text-rose-300 rounded-xl p-3 text-xs flex flex-col space-y-1 text-left transition h-full"
                  >
                    <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide text-rose-450 text-rose-300">
                      ⚡ Simular Conflito de Código
                    </span>
                    <span className="text-[10px] font-light leading-relaxed text-rose-400/90">
                      Injeta instantaneamente um arquivo de conflito para testar o **Built-in Merge Conflict Editor**.
                    </span>
                  </button>
                </div>

                {/* PROJECT TEAM WIDGET */}
                <div className="pt-1 select-none">
                  <div className={`border rounded-xl p-3 space-y-3 ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80"}`}>
                    <div className={`flex items-center justify-between border-b pb-1.5 ${isLightTheme ? "border-slate-200" : "border-slate-900"}`}>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#6366f1] font-bold flex items-center gap-1">
                        <Users className="h-3 w-3" /> Equipe do Projeto
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowConfigEditor(!showConfigEditor)}
                          className={`p-1 rounded hover:bg-indigo-950/40 text-xs transition ${showConfigEditor ? "text-[#6366f1] bg-indigo-950/20" : "text-slate-500 hover:text-indigo-400"}`}
                          title="Melhorar/Personalizar seu Perfil Git ($ git config)"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleCommandLineExec("git team")}
                          className="text-[9px] text-[#6366f1] hover:text-[#4f46e5] font-mono hover:underline cursor-pointer font-bold"
                          title="Executa git team no console terminal"
                        >
                          git team
                        </button>
                      </div>
                    </div>

                    {/* Git Config Interactive Settings Accordion Form */}
                    {showConfigEditor && (
                      <div className={`p-2.5 rounded-lg border text-[11px] space-y-2.5 ${isLightTheme ? "bg-white border-slate-200 text-slate-700" : "bg-slate-950/70 border-slate-900 text-slate-300"}`}>
                        <div className="font-bold text-[10px] uppercase font-mono tracking-wider text-indigo-400 flex items-center justify-between">
                          <span>⚙️ Git Config Local</span>
                          <button onClick={() => setShowConfigEditor(false)} className="text-slate-500 hover:text-slate-300 font-mono text-xs">X</button>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-500">Nome do Autor (user.name)</label>
                          <input
                            type="text"
                            value={gitConfigName}
                            onChange={(e) => setGitConfigName(e.target.value)}
                            placeholder="Ex: John Doe"
                            className={`w-full px-2 py-1 rounded border text-[11.5px] outline-none ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-500">E-mail (user.email)</label>
                          <input
                            type="email"
                            value={gitConfigEmail}
                            onChange={(e) => setGitConfigEmail(e.target.value)}
                            placeholder="Ex: john@dev.io"
                            className={`w-full px-2 py-1 rounded border text-[11.5px] outline-none ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[9px] uppercase tracking-wider text-slate-500">Avatar do Desenvolvedor</label>
                          <div className="flex gap-2 items-center flex-wrap">
                            {[
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=65&h=65&fit=crop", // Male dev
                              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=65&h=65&fit=crop", // Female dev
                              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=65&h=65&fit=crop", // Male architect
                              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=65&h=65&fit=crop"  // Redhead female dev
                            ].map((url, i) => (
                              <button
                                key={url}
                                type="button"
                                onClick={() => setGitConfigAvatar(url)}
                                className={`rounded-full overflow-hidden border-2 transition ${gitConfigAvatar === url ? "border-indigo-400 scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                              >
                                <img src={url} alt={`Avatar option ${i}`} className="h-6 w-6 object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowConfigEditor(false);
                            addTerminalLine(`>>> git config --local user.name "${gitConfigName}"`);
                            addTerminalLine(`>>> git config --local user.email "${gitConfigEmail}"`);
                            addTerminalLine(`[Configurador Git] Nova identidade salva! Todos os commits criados usarão este perfil.`);
                          }}
                          className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-[9px] uppercase tracking-wide py-1 rounded transition duration-150 cursor-pointer"
                        >
                          Aplicar Identidade
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {/* Connected User */}
                      <div className={`flex items-center justify-between p-1.5 rounded-lg border transition ${isLightTheme ? "hover:border-slate-300 bg-white" : "bg-slate-950/40 border-transparent hover:border-slate-800"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={gitConfigAvatar}
                              alt={gitConfigName}
                              referrerPolicy="no-referrer"
                              className="h-6 w-6 rounded-full object-cover border border-indigo-500/20"
                            />
                            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-slate-950"></span>
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10.5px] font-semibold block truncate leading-tight ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                              {gitConfigName} (Você)
                            </span>
                            <span className="text-[9px] text-slate-500 block truncate font-mono">
                              {gitConfigEmail}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addTerminalLine(`>>> git log --author="${gitConfigName}"`);
                            addTerminalLine(`Filtrando commits criados por: ${gitConfigName}`);
                            const userCommits = activeSimRepo.commits.filter(c => c.author === gitConfigName);
                            if (userCommits.length === 0) {
                              addTerminalLine("Nenhum commit encontrado criado por você nesta branch atual.");
                            } else {
                              userCommits.forEach(c => addTerminalLine(`  * ${c.sha} - ${c.message} (${c.date})`));
                            }
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${isLightTheme ? "bg-slate-100 hover:bg-slate-205 border border-slate-300 text-slate-600" : "bg-slate-900 hover:bg-indigo-950 hover:text-indigo-405 border border-slate-800 text-slate-400"}`}
                          title="Listar commits deste autor"
                        >
                          Logs
                        </button>
                      </div>

                      {/* Alice */}
                      <div className={`flex items-center justify-between p-1.5 rounded-lg border transition ${isLightTheme ? "hover:border-slate-300 bg-white" : "bg-slate-950/40 border-transparent hover:border-slate-800"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
                              alt="Alice"
                              referrerPolicy="no-referrer"
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-slate-700 ring-1 ring-slate-950"></span>
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10.5px] font-semibold block truncate leading-tight ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                              Alice
                            </span>
                            <span className="text-[9px] text-[#6366f1] block truncate font-semibold">
                              Co-Founder & Lead
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addTerminalLine('>>> git log --author="Alice"');
                            addTerminalLine("Filtrando commits criados por: Alice");
                            const matching = activeSimRepo.commits.filter(c => c.author.includes("Alice"));
                            matching.forEach(c => addTerminalLine(`  * ${c.sha} - ${c.message} (${c.date})`));
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${isLightTheme ? "bg-slate-100 hover:bg-slate-205 border border-slate-300 text-slate-600" : "bg-slate-900 hover:bg-indigo-950 hover:text-indigo-405 border border-slate-800 text-slate-400"}`}
                        >
                          Logs
                        </button>
                      </div>

                      {/* Bob */}
                      <div className={`flex items-center justify-between p-1.5 rounded-lg border transition ${isLightTheme ? "hover:border-slate-300 bg-white" : "bg-slate-950/40 border-transparent hover:border-slate-800"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop"
                              alt="Bob"
                              referrerPolicy="no-referrer"
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-slate-700 ring-1 ring-slate-950"></span>
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10.5px] font-semibold block truncate leading-tight ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                              Bob
                            </span>
                            <span className="text-[9px] text-amber-500 block truncate font-semibold">
                              Principal Architect
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addTerminalLine('>>> git log --author="Bob"');
                            addTerminalLine("Filtrando commits criados por: Bob");
                            const matching = activeSimRepo.commits.filter(c => c.author.includes("Bob"));
                            matching.forEach(c => addTerminalLine(`  * ${c.sha} - ${c.message} (${c.date})`));
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${isLightTheme ? "bg-slate-100 hover:bg-slate-205 border border-slate-300 text-slate-600" : "bg-slate-900 hover:bg-indigo-950 hover:text-indigo-405 border border-slate-800 text-slate-400"}`}
                        >
                          Logs
                        </button>
                      </div>

                      {/* Carol */}
                      <div className={`flex items-center justify-between p-1.5 rounded-lg border transition ${isLightTheme ? "hover:border-slate-300 bg-white" : "bg-slate-950/40 border-transparent hover:border-slate-800"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop"
                              alt="Carol"
                              referrerPolicy="no-referrer"
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-slate-700 ring-1 ring-slate-950"></span>
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10.5px] font-semibold block truncate leading-tight ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                              Carol
                            </span>
                            <span className="text-[9px] text-emerald-500 block truncate font-semibold">
                              Senior Frontend
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addTerminalLine('>>> git log --author="Carol"');
                            addTerminalLine("Filtrando commits criados por: Carol");
                            const matching = activeSimRepo.commits.filter(c => c.author.includes("Carol"));
                            matching.forEach(c => addTerminalLine(`  * ${c.sha} - ${c.message} (${c.date})`));
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${isLightTheme ? "bg-slate-100 hover:bg-slate-205 border border-slate-300 text-slate-600" : "bg-slate-900 hover:bg-indigo-950 hover:text-indigo-405 border border-slate-800 text-slate-400"}`}
                        >
                          Logs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staging / Working Directory Index Area */}
                <div className="space-y-3.5 bg-slate-950 border border-slate-800/65 rounded-xl p-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Index files staged header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                        Área de Staging ({activeSimRepo.stagedFiles.length + activeSimRepo.unstagedFiles.length} Alterações)
                      </span>
                      <div className="flex gap-1.5 text-[10px]">
                        <button
                          onClick={handleStageAll}
                          disabled={activeSimRepo.unstagedFiles.length === 0}
                          className="text-indigo-400 font-bold hover:underline disabled:opacity-50"
                        >
                          Stage All
                        </button>
                        <span className="text-slate-800">|</span>
                        <button
                          onClick={handleUnstageAll}
                          disabled={activeSimRepo.stagedFiles.length === 0}
                          className="text-slate-500 font-bold hover:underline disabled:opacity-50"
                        >
                          Unstage All
                        </button>
                      </div>
                    </div>

                    {/* Files List mapping */}
                    <div className="space-y-1 px-0.5 overflow-y-auto max-h-40">
                      {activeSimRepo.unstagedFiles.map((file) => (
                        <div
                          key={file.filepath}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-900 text-xs text-slate-300 hover:border-slate-800 transition"
                        >
                          <div
                            onClick={() => {
                              setActiveDiffFile(file);
                              if (file.status === "conflict") {
                                setConflictFile(file);
                              } else {
                                setConflictFile(null);
                              }
                            }}
                            className="flex-1 min-w-0 pr-2 select-none cursor-pointer truncate"
                          >
                            <span className="font-mono text-[11px] font-medium">{file.filepath}</span>
                            <span className={`text-[9px] ml-1.5 font-mono px-1 py-0.2 rounded uppercase ${
                              file.status === "conflict" ? "bg-rose-950 border border-rose-900 text-rose-400" : "bg-amber-950 border border-amber-900/60 text-amber-400"
                            }`}>
                              {file.status}
                            </span>
                          </div>
                          {file.status !== "conflict" ? (
                            <button
                              onClick={() => handleStageFile(file.filepath)}
                              className="p-1 hover:bg-slate-800 text-emerald-400 rounded transition shrink-0 cursor-pointer"
                              title="Stage changes"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                          )}
                        </div>
                      ))}

                      {activeSimRepo.stagedFiles.map((file) => (
                        <div
                          key={file.filepath}
                          className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/20 border border-indigo-950/50 text-xs text-indigo-300 hover:border-indigo-900 transition"
                        >
                          <div
                            onClick={() => {
                              setActiveDiffFile(file);
                              setConflictFile(null);
                            }}
                            className="flex-1 min-w-0 pr-2 select-none cursor-pointer truncate"
                          >
                            <span className="font-mono text-[11px] font-semibold">{file.filepath}</span>
                            <span className="text-[9px] ml-1.5 font-mono px-1 py-0.2 rounded bg-indigo-950/60 border border-indigo-900 text-indigo-400 uppercase">
                              staged
                            </span>
                          </div>
                          <button
                            onClick={() => handleUnstageFile(file.filepath)}
                            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition shrink-0 cursor-pointer"
                            title="Unstage file"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {activeSimRepo.unstagedFiles.length === 0 && activeSimRepo.stagedFiles.length === 0 && (
                        <p className="text-[10px] text-slate-500 italic text-center py-6">
                          Working tree clean. Sem modificações.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Staged Commitment Area Form */}
                  <form onSubmit={handlePerformCommit} className="border-t border-slate-900 pt-3.5 mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commitTitle}
                          onChange={(e) => setCommitTitle(e.target.value)}
                          placeholder="Mensagem do commit (ex: feat: add checkout UI)"
                          className="flex-1 bg-slate-950 border border-[#1d2432]/90 rounded-lg text-xs px-2.5 py-2 text-slate-100 font-sans outline-none focus:border-indigo-505 placeholder:text-slate-700"
                          required
                        />
                        <button
                          type="button"
                          onClick={generateAICommitMsg}
                          disabled={isCommittingAI}
                          className="px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-900/60 hover:bg-[#111622] text-indigo-400 font-bold shrink-0 text-[10px] uppercase font-mono tracking-wider flex items-center justify-center cursor-pointer gap-1 transition"
                          title="Sugerir mensagem descritiva de commit com IA"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
                          <span>{isCommittingAI ? "Buscando..." : "Gerar com IA"}</span>
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs py-2 px-3 rounded-lg transition text-center flex items-center justify-center gap-1 text-white shadow shadow-indigo-600/10 cursor-pointer"
                    >
                      <GitCommit className="h-4 w-4 shrink-0" /> Commit no Branch {activeSimRepo.activeBranch}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          }
          graph={
            <div className="flex-1 flex flex-col space-y-4 h-full p-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-[15px] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" /> Fluxo Visual de Commit Tree Histórica (Interativo)
                  </h2>
                  <span className="text-[10px] text-slate-500 italic">
                    Clique em qualquer nodo para ver suas propriedades e alterações de arquivos:
                  </span>
                </div>

                <GitGraph
                  commits={activeSimRepo.commits}
                  activeBranch={activeSimRepo.activeBranch}
                  selectedCommitSha={selectedCommitSha}
                  onSelectCommit={(c) => {
                    setSelectedCommitSha(c.sha);
                    setActiveDiffFile(null);
                    setConflictFile(null);
                  }}
                  isLightTheme={isLightTheme}
                />
              </div>
                }
                properties={
                  <div className={`p-4 flex flex-col h-full ${isLightTheme ? "bg-white text-slate-800" : "bg-transparent text-slate-200"}`}>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block mb-2 border-b pb-2 border-slate-800/60">
                    Propriedades & Ações
                  </span>
                  
                  {/* Selected Commit details & actions */}
                  {selectedSimCommit && (
                    <div className="mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-2 select-none">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9.5px] font-mono text-indigo-400 font-bold break-all">
                          SHA: {selectedSimCommit.sha}
                        </span>
                        <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded shrink-0 ${getBranchColorClass(selectedSimCommit.branch).bg} ${getBranchColorClass(selectedSimCommit.branch).text}`}>
                          {selectedSimCommit.branch}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-200 line-clamp-2">
                        {selectedSimCommit.message}
                      </p>
                      <div className="text-[9.5px] text-slate-500 font-light flex items-center justify-between">
                        <span>Autor: {selectedSimCommit.author}</span>
                        <span>{selectedSimCommit.date}</span>
                      </div>

                      {/* Simulator actions list */}
                      {!selectedRepoIdSim.startsWith("github-") && (
                        <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-900/80">
                          {/* Cherry Pick action button */}
                          {selectedSimCommit.branch !== activeSimRepo.activeBranch && (
                            <button
                              onClick={() => handleCherryPickSim(selectedSimCommit)}
                              className="w-full text-left text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-slate-950 border border-indigo-900/40 p-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                              title="Copia este commit para a ramificação ativa selecionada"
                            >
                              <GitPullRequest className="h-3 w-3" /> Cherry-pick para {activeSimRepo.activeBranch}
                            </button>
                          )}

                          {/* Squash Commit action button */}
                          {selectedSimCommit.branch === activeSimRepo.activeBranch && (
                            <button
                              onClick={() => handleSquashCommitSim(selectedSimCommit)}
                              className="w-full text-left text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-slate-950 border border-amber-900/40 p-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                              title="Mescla (Squash) este local commit com seu antecessor na árvore"
                            >
                              <Layers className="h-3 w-3" /> Squash com anterior
                            </button>
                          )}

                          {/* Revert Commit action button */}
                          <button
                            onClick={() => handleRevertCommitSim(selectedSimCommit)}
                            className="w-full text-left text-[10px] font-bold text-rose-450 hover:text-rose-400 bg-rose-955/30 hover:bg-slate-950 border border-rose-900/40 p-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                            title="Deleta/reverte modificações gerando commit reverso"
                          >
                            <XCircle className="h-3 w-3" /> Reverter Commit (git revert)
                          </button>

                          {/* Git Reset actions block */}
                          <div className="pt-2 border-t border-slate-900/60 mt-1 select-none">
                            <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                              Redefinir HEAD (git reset)
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                onClick={() => handleResetSimAction(selectedSimCommit, "soft")}
                                className="text-[10px] py-1 px-1 font-bold text-center text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-slate-950 border border-emerald-900/40 rounded transition cursor-pointer"
                                title="git reset --soft: move branch para cá, jogando diferenças para Staging (Staged)"
                              >
                                --soft
                              </button>
                              <button
                                onClick={() => handleResetSimAction(selectedSimCommit, "mixed")}
                                className="text-[10px] py-1 px-1 font-bold text-center text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-slate-950 border border-amber-900/40 rounded transition cursor-pointer"
                                title="git reset --mixed: move branch para cá, jogando diferenças para Working Dir (Unstaged)"
                              >
                                --mixed
                              </button>
                              <button
                                onClick={() => handleResetSimAction(selectedSimCommit, "hard")}
                                className="text-[10px] py-1 px-1 font-bold text-center text-rose-450 hover:text-rose-400 bg-rose-955/30 hover:bg-slate-950 border border-rose-900/40 rounded transition cursor-pointer"
                                title="git reset --hard: move branch para cá, jogando fora qualquer mudança local"
                              >
                                --hard
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-3 border-b pb-2 border-slate-800">
                    Arquivos Modificados
                  </span>
                  
                  {selectedRepoIdSim.startsWith("github-") ? (
                    githubFilesLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-2">
                        <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
                        <span className="text-[10px] text-slate-500 font-mono">Buscando diffs...</span>
                      </div>
                    ) : githubCommitFiles.length > 0 ? (
                      <div className="space-y-1 overflow-y-auto max-h-36 pr-1">
                        {githubCommitFiles.map((file) => {
                          const isSelected = activeDiffFile?.filepath === file.filepath;
                          const colorMap = {
                            added: "bg-emerald-950 border border-emerald-900 text-emerald-400",
                            deleted: "bg-rose-950 border border-rose-900 text-rose-400",
                            modified: "bg-amber-950 border border-amber-900/60 text-amber-400"
                          };
                          const statusLetterMap = {
                            added: "A",
                            deleted: "D",
                            modified: "M"
                          };
                          const statusClass = colorMap[file.status as keyof typeof colorMap] || "bg-indigo-950 border border-indigo-900 text-indigo-400";
                          const statusLetter = statusLetterMap[file.status as keyof typeof statusLetterMap] || "M";

                          return (
                            <div
                              key={file.filepath}
                              onClick={() => {
                                setConflictFile(null);
                                setActiveDiffFile({
                                  filepath: file.filepath,
                                  status: file.status,
                                  content: "",
                                  originalContent: "",
                                  diff: file.diff
                                });
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-mono transition flex items-center justify-between cursor-pointer ${isSelected ? "bg-indigo-950/30 text-indigo-400 font-semibold border-indigo-900/60" : "border-transparent text-slate-400 hover:bg-slate-950 hover:text-slate-200"}`}
                            >
                              <span className="truncate max-w-[140px] text-[11px]" title={file.filepath}>{file.filepath}</span>
                              <span className={`text-[8px] font-bold rounded px-1.5 min-w-[18px] text-center ${statusClass}`}>{statusLetter}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic py-6 text-center">
                        Sem arquivos de alteração neste commit.
                      </p>
                    )
                  ) : selectedSimCommit ? (
                    <div className="space-y-1 overflow-y-auto max-h-36 pr-1">
                      {/* In a mock selected commit, display a list of mock changes */}
                      <div
                        onClick={() => {
                          setConflictFile(null);
                          setActiveDiffFile({
                            filepath: "src/App.tsx",
                            status: "modified",
                            content: "",
                            originalContent: "",
                            diff: `@@ -40,4 +40,5 @@\n- import { Server } from "lucide-react";\n+ import { Server, GitBranch } from "lucide-react";\n  import { useState } from "react";\n+ console.log("Git Kraken tree renderized.");`
                          });
                        }}
                        className={`p-2 rounded-lg cursor-pointer text-xs font-mono transition flex items-center justify-between ${activeDiffFile?.filepath === "src/App.tsx" ? "bg-indigo-950/30 text-indigo-400 font-semibold border border-indigo-900/40" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"}`}
                      >
                        <span>src/App.tsx</span>
                        <span className="text-[8px] uppercase bg-amber-950 text-amber-400 border border-amber-900 rounded px-1">M</span>
                      </div>
                      <div
                        onClick={() => {
                          setConflictFile(null);
                          setActiveDiffFile({
                            filepath: "package.json",
                            status: "modified",
                            content: "",
                            originalContent: "",
                            diff: `@@ -10,3 +10,4 @@\n  "dependencies": {\n-   "react": "^18.0.0"\n+   "react": "^19.0.1",\n+   "lucide-react": "^0.540.0"`
                          });
                        }}
                        className={`p-2 rounded-lg cursor-pointer text-xs font-mono transition flex items-center justify-between ${activeDiffFile?.filepath === "package.json" ? "bg-indigo-950/30 text-indigo-400 font-semibold border border-indigo-900/40" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"}`}
                      >
                        <span>package.json</span>
                        <span className="text-[8px] uppercase bg-indigo-950 text-indigo-400 border border-indigo-900 rounded px-1">M</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic py-6">
                      Selecione um commit no gráfico acima.
                    </p>
                  )}
                  </div>
                }
                diff={
                  <div className="h-full w-full">
                  {conflictFile ? (
                    <MergeConflictEditor
                      conflictFile={conflictFile}
                      onResolve={handleResolveConflictFile}
                      isLightTheme={isLightTheme}
                    />
                  ) : activeDiffFile ? (
                    <DiffViewer
                      filename={activeDiffFile.filepath}
                      diffText={activeDiffFile.diff}
                      isLightTheme={isLightTheme}
                    />
                  ) : (
                    <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center h-full select-none ${isLightTheme ? "bg-white border-slate-200 text-slate-500" : "bg-slate-900 border-slate-850/80 text-slate-400"}`}>
                      <Code className="h-6 w-6 text-slate-600 animate-pulse mb-2 shrink-0" />
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-300 block">Nenhum Arquivo Selecionado</span>
                        <p className="text-[10px] text-slate-500 max-w-xs font-light">
                          Selecione um arquivo listado na Área de Staging ou em um Commit ativo para visualizar as modificações de linhas.
                        </p>
                      </div>
                    </div>
                  )}
                  </div>
                }
                terminal={
                  <div className="h-full">
                    <TerminalView
                logs={terminalLogs}
                onCommand={handleCommandLineExec}
                availableBranches={activeSimRepo.branches}
                activeBranch={activeSimRepo.activeBranch}
                    isLightTheme={isLightTheme}
                  />
                  </div>
                }
              />
            )}

        {/* --- Pull Requests Hub view integration --- */}
        {krakenSubTab === "prs" && (
          <GitKrakenPRs
            isLightTheme={isLightTheme}
            pullRequests={pullRequests}
            setPullRequests={setPullRequests}
            activePRId={activePRId}
            setActivePRId={setActivePRId}
            newPRTitle={newPRTitle}
            setNewPRTitle={setNewPRTitle}
            newPRDesc={newPRDesc}
            setNewPRDesc={setNewPRDesc}
            newPRSource={newPRSource}
            setNewPRSource={setNewPRSource}
            newPRTarget={newPRTarget}
            setNewPRTarget={setNewPRTarget}
            prCommentInput={prCommentInput}
            setPrCommentInput={setPrCommentInput}
            activeSimRepo={activeSimRepo}
            setRepositories={setRepositories}
            selectedRepoIdSim={selectedRepoIdSim}
            addTerminalLine={addTerminalLine}
            serverUser={serverState.user}
          />
        )}

        {/* --- Jira Agile Integration view integration --- */}
        {krakenSubTab === "jira" && (
          <GitKrakenJira
            isLightTheme={isLightTheme}
            jiraIssues={jiraIssues}
            setJiraIssues={setJiraIssues}
            activeJiraIssueId={activeJiraIssueId}
            setActiveJiraIssueId={setActiveJiraIssueId}
            jiraCommentInput={jiraCommentInput}
            setJiraCommentInput={setJiraCommentInput}
            newJiraTitle={newJiraTitle}
            setNewJiraTitle={setNewJiraTitle}
            newJiraDesc={newJiraDesc}
            setNewJiraDesc={setNewJiraDesc}
            newJiraAssignee={newJiraAssignee}
            setNewJiraAssignee={setNewJiraAssignee}
            activeSimRepo={activeSimRepo}
            setRepositories={setRepositories}
            selectedRepoIdSim={selectedRepoIdSim}
            addTerminalLine={addTerminalLine}
            serverUser={serverState.user}
          />
        )}

        {/* --- GitLens AI Explainer view integration --- */}
        {krakenSubTab === "gitlens" && (
          <GitKrakenGitLens
            isLightTheme={isLightTheme}
            gitLensActiveFile={gitLensActiveFile}
            setGitLensActiveFile={setGitLensActiveFile}
            gitLensExplanation={gitLensExplanation}
            setGitLensExplanation={setGitLensExplanation}
            gitLensExplaining={gitLensExplaining}
            setGitLensExplaining={setGitLensExplaining}
          />
        )}

        {/* --- Multiple Git Worktrees view integration --- */}
        {krakenSubTab === "worktrees" && (
          <GitKrakenWorktrees
            isLightTheme={isLightTheme}
            worktrees={worktrees}
            setWorktrees={setWorktrees}
            newWorktreeBranch={newWorktreeBranch}
            setNewWorktreeBranch={setNewWorktreeBranch}
            newWorktreePath={newWorktreePath}
            setNewWorktreePath={setNewWorktreePath}
            activeSimRepo={activeSimRepo}
            setRepositories={setRepositories}
            selectedRepoIdSim={selectedRepoIdSim}
            addTerminalLine={addTerminalLine}
          />
        )}

          </div>
        )}

        {/* --- ADVANCED KRAKEN OVERLAY MODALS --- */}

        {/* 1. FUZZY FINDER DIALOG (Cmd+P) */}
        {isFuzzyFinderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0d121d] text-slate-100 shadow-2xl overflow-hidden animate-fade-in">
              
              {/* Top Search bar input */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-[#0d111b]/90">
                <div className="flex items-center gap-2.5 flex-1">
                  <Search className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    value={fuzzySearchQuery}
                    onChange={(e) => setFuzzySearchQuery(e.target.value)}
                    placeholder="Pesquise commits (mensagem, SHA), branches locais ou arquivos modificados..."
                    className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setIsFuzzyFinderOpen(false); setFuzzySearchQuery(""); }}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Interactive results container */}
              <div className="p-2 max-h-80 overflow-y-auto space-y-1 bg-[#090c13]">
                
                {/* Helper guide */}
                <div className="p-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold">Resultados Filtrados</div>
                
                {/* COMMITS MATCHED */}
                {(() => {
                  const commitsMatched = activeSimRepo.commits.filter(c => 
                    c.message.toLowerCase().includes(fuzzySearchQuery.toLowerCase()) || 
                    c.sha.toLowerCase().includes(fuzzySearchQuery.toLowerCase())
                  );
                  if (commitsMatched.length === 0) return null;
                  return (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold tracking-widest pl-2 block my-1">Commits ({commitsMatched.length})</span>
                      {commitsMatched.map(c => (
                        <div
                          key={c.sha}
                          onClick={() => {
                            setSelectedCommitSha(c.sha);
                            setIsFuzzyFinderOpen(false);
                            setFuzzySearchQuery("");
                            addTerminalLine(`[Fuzzy Search] commit selecionado: ${c.sha} - ${c.message}`);
                          }}
                          className="p-2.5 rounded-lg hover:bg-indigo-600 hover:text-white cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-mono text-indigo-400 font-bold bg-[#141b2c] text-[10px] px-1.5 py-0.5 rounded">{c.sha}</span>
                            <span className="truncate font-light text-slate-200">{c.message}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono italic">by {c.author}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* BRANCHES MATCHED */}
                {(() => {
                  const branchesMatched = activeSimRepo.branches.filter(b => b.toLowerCase().includes(fuzzySearchQuery.toLowerCase()));
                  if (branchesMatched.length === 0) return null;
                  return (
                    <div className="space-y-0.5 mt-2">
                      <span className="text-[9px] font-mono text-amber-400 uppercase font-bold tracking-widest pl-2 block my-1">Branches ({branchesMatched.length})</span>
                      {branchesMatched.map(b => (
                        <div
                          key={b}
                          onClick={() => {
                            setRepositories(prev => prev.map(repo => {
                              if (repo.id !== selectedRepoIdSim) return repo;
                              return { ...repo, activeBranch: b };
                            }));
                            addTerminalLine(`[Fuzzy Search] Ativando branch: ${b}`);
                            setIsFuzzyFinderOpen(false);
                            setFuzzySearchQuery("");
                          }}
                          className="p-2.5 rounded-lg hover:bg-amber-600 hover:text-white cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                            <span className="font-mono">{b}</span>
                          </div>
                          <span className="text-[9px] uppercase bg-[#1e1b10] border border-amber-900/60 font-bold text-amber-400 px-1.5 py-0.2 rounded font-mono shrink-0">checkout</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* FILES MATCHED */}
                {(() => {
                  const filesMatched = [
                    ...activeSimRepo.unstagedFiles.map(f => ({ ...f, type: "unstaged" })),
                    ...activeSimRepo.stagedFiles.map(f => ({ ...f, type: "staged" }))
                  ].filter(f => f.filepath.toLowerCase().includes(fuzzySearchQuery.toLowerCase()));
                  if (filesMatched.length === 0) return null;
                  return (
                    <div className="space-y-0.5 mt-2">
                      <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold tracking-widest pl-2 block my-1">Arquivos Pendentes ({filesMatched.length})</span>
                      {filesMatched.map(f => (
                        <div
                          key={f.filepath}
                          onClick={() => {
                            setActiveDiffFile(f);
                            setIsFuzzyFinderOpen(false);
                            setFuzzySearchQuery("");
                          }}
                          className="p-2.5 rounded-lg hover:bg-emerald-600 hover:text-white cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-[8px] font-mono uppercase bg-[#0f241a] px-1.5 py-0.5 border border-emerald-900 text-emerald-400 rounded">{f.type}</span>
                            <span className="font-mono text-slate-300 truncate">{f.filepath}</span>
                          </div>
                          <span className="text-[10px] bg-slate-900 border text-slate-500 rounded px-1.5 font-mono">{f.status}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* If completely empty search matches */}
                {fuzzySearchQuery && (() => {
                  const matchedCount = activeSimRepo.commits.filter(c => c.message.toLowerCase().includes(fuzzySearchQuery.toLowerCase()) || c.sha.toLowerCase().includes(fuzzySearchQuery.toLowerCase())).length
                    + activeSimRepo.branches.filter(b => b.toLowerCase().includes(fuzzySearchQuery.toLowerCase())).length
                    + [ ...activeSimRepo.unstagedFiles, ...activeSimRepo.stagedFiles ].filter(f => f.filepath.toLowerCase().includes(fuzzySearchQuery.toLowerCase())).length;
                  
                  if (matchedCount === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-slate-500 italic">
                        Nenhum resultado corresponde à chave de busca "{fuzzySearchQuery}". Tente novamente!
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>

              <div className="p-3 border-t border-slate-800 bg-[#0a0d14] text-[10px] font-mono text-slate-500 flex justify-between select-none font-semibold">
                <span>Pressione <kbd className="text-indigo-400 font-bold bg-slate-950 px-1 rounded">ESC</kbd> para fechar</span>
                <span>Aprimorado por GitKraken Algorithmic Engine</span>
              </div>

            </div>
          </div>
        )}

        {/* 2. KEYBOARD SHORTCUTS PALETTE PANEL */}
        {isShortcutsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d121d] text-slate-105 shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display font-bold text-sm tracking-wide text-white flex items-center gap-2">
                  <Code className="h-4.5 w-4.5 text-indigo-400" />
                  Teclas de Atalho de Alta Performance
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShortcutsOpen(false)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 font-normal text-xs leading-normal text-slate-400">
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  Navegue no simulador GitKraken como um verdadeiro engenheiro de software experiente usando estes atalhos nativos:
                </p>

                <div className="space-y-2 select-none font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 text-[11px]">Abrir Fuzzy Finder Global</span>
                    <kbd className="bg-indigo-950/60 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded text-[10px] font-bold">Ctrl/Cmd + P</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 text-[11px]">Abrir Paleta de Teclas</span>
                    <kbd className="bg-indigo-950/60 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded text-[10px] font-bold">Ctrl/Cmd + /</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 text-[11px]">Focar Barra de Filtro Lateral</span>
                    <kbd className="bg-indigo-950/60 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded text-[10px] font-bold">Ctrl/Cmd + Alt + F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span className="text-slate-400 text-[11px]">Desfazer Último Commit</span>
                    <kbd className="bg-indigo-950/60 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded text-[10px] font-bold">Botão Undo</kbd>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsShortcutsOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-lg text-xs w-full text-white cursor-pointer animate-pulse"
                >
                  Entendido, Fechar Guia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. REPOSITORY IMPORT AND CLONE MODAL */}
        {isRepoImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d121d] text-slate-100 shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display font-bold text-sm tracking-wide text-white flex items-center gap-2">
                  <FolderOpen className="h-4.5 w-4.5 text-emerald-400" />
                  Clonar Repositório Público do GitHub
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRepoImportModalOpen(false)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 font-normal text-xs">
                <p className="text-[11px] text-slate-400 leading-normal font-light">
                  Insira qualquer repositório público real do GitHub (no formato <b>dono/nome-do-repo</b>). O GitKraken tentará buscar os metadados em tempo real de commits e ramificações usando nossa infraestrutura de proxy GitHub API.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Identificador GitHub (Dono/Repo)</label>
                    <input
                      type="text"
                      value={importRepoName}
                      onChange={(e) => setImportRepoName(e.target.value)}
                      placeholder="Ex: facebook/react ou vercel/next.js"
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-100 outline-none focus:border-emerald-500 placeholder:text-slate-700 font-sans"
                    />
                  </div>

                  <div className="space-y-1 font-normal">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Breve Descrição do Workspace (Opcional)</label>
                    <input
                      type="text"
                      value={importRepoDesc}
                      onChange={(e) => setImportRepoDesc(e.target.value)}
                      placeholder="Ex: Meu clone de validação interativa"
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-100 outline-none focus:border-emerald-500 placeholder:text-slate-700 font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRepoImportModalOpen(false)}
                    className="flex-1 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 rounded-lg cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (importRepoName.trim() && importRepoName.includes("/")) {
                        importRepository(importRepoName.trim(), importRepoDesc.trim());
                      } else {
                        showToast("Identificador inválido! Insira no formato correto: dono/repositorio (ex: angular/angular).", "error");
                      }
                    }}
                    disabled={!importRepoName.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-505 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer transition"
                  >
                    Iniciar Clonagem
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB B: LIVE CI/CD AUTOMATION CONFIGURATION (GitKraken automation engine) --- */}
        {activeTab === "gitdeploy" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* Sidebar configurations (Left) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Personal account sync card */}
              <div className={`p-5 rounded-2xl border ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-300">
                    Perfil GitHub Real
                  </span>
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                </div>

                {!serverState.connected ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-normal font-light">
                      Você pode conectar uma conta verdadeira do GitHub para escutar mudanças ou sincronizar seus repositórios reais de código!
                    </p>
                    <button
                      onClick={handleOAuthLogin}
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-white text-slate-950 font-semibold py-2.5 px-4 rounded-xl transition text-xs font-sans cursor-pointer"
                    >
                      <Github className="h-4 w-4" /> Conectar via GitHub OAuth
                    </button>

                    <div className="relative flex py-2 items-center text-slate-650 justify-center text-[10px] tracking-widest uppercase font-mono">
                      <span>ou use seu token</span>
                    </div>

                    <form onSubmit={handleTokenLogin} className="space-y-2">
                      <input
                        type="password"
                        placeholder="ghp_xxxxxxxx"
                        value={personalToken}
                        onChange={(e) => setPersonalToken(e.target.value)}
                        className={`w-full outline-none border text-xs px-3 py-2 rounded-xl font-mono ${isLightTheme ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-800 text-indigo-400"}`}
                      />
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs py-2 rounded-xl text-center cursor-pointer text-white"
                      >
                        Conectar via Token PAT
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800/60 p-3 rounded-xl">
                      {serverState.user?.avatar_url && (
                        <img
                          src={serverState.user.avatar_url}
                          alt={serverState.user.login}
                          className="h-8 w-8 rounded-full ring-2 ring-indigo-500 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-slate-200 block truncate">{serverState.user?.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">@{serverState.user?.login}</span>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="text-slate-550 hover:text-rose-450 p-1 shrink-0 transition"
                        title="Desvincular Conta"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Repo Selector / Trigger form */}
              <div className={`p-5 rounded-2xl border ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}>
                {!serverState.connectedRepo ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-md text-white flex items-center gap-1.5">
                        <GitBranch className="h-4 w-4 text-indigo-400" /> Monitorar Repositório
                      </h3>
                      <p className="text-xs text-slate-400 font-light">
                        Selecione um repositório Git de sua conta real conectada para sincronizar deploys.
                      </p>
                    </div>

                    {!serverState.connected ? (
                      <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-950/40 border border-slate-900 rounded-xl">
                        Conecte a sua conta do GitHub acima primeiro para listar seus repositórios.
                      </p>
                    ) : (
                      <form onSubmit={handleConnectRepo} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Filtrar lista</label>
                          <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={repoSearch}
                            onChange={(e) => setRepoSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Repositório GitHub</label>
                          <div className="relative">
                            <select
                              value={selectedRepoId}
                              onChange={(e) => setSelectedRepoId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200 appearance-none"
                            >
                              <option value="">Selecione um repositório...</option>
                              {githubRepos
                                .filter((r) => r.full_name.toLowerCase().includes(repoSearch.toLowerCase()))
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.full_name}
                                  </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!selectedRepoId}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2 rounded-xl text-xs"
                        >
                          Ativar Monitoramento de Code Deploy
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">
                      Repositório Trackeado Ativo
                    </span>

                    <div className="bg-slate-950 p-4 border border-slate-800/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Github className="h-4.5 w-4.5 text-indigo-400" />
                        <div>
                          <span className="text-sm font-bold text-white block truncate">{serverState.connectedRepo.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{serverState.connectedRepo.full_name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs font-mono pt-1 text-slate-400">
                        <span>language: {serverState.connectedRepo.language}</span>
                        <span>branch: {serverState.connectedRepo.branch}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-900 leading-normal">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Deploy Manual</span>
                      <button
                        onClick={triggerManualBuild}
                        disabled={serverState.deployments.some((d) => d.status === "BUILDING" || d.status === "QUEUED")}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs text-white font-medium py-2 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Play className="h-3 w-3 fill-current" /> Forçar Compilação Manual
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Display list logs / historical dashboard pipelines */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              
              {/* Deployment compilation logs screen */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500 select-none"></span>
                      <span className="h-3 w-3 rounded-full bg-amber-500 select-none"></span>
                      <span className="h-3 w-3 rounded-full bg-emerald-500 select-none"></span>
                    </div>
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono text-xs font-semibold text-slate-350">Saída Consoladora do Servidor de Build</span>
                  </div>
                  {activeDeployment && (
                    <span className="font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-full px-2.5 py-0.5 text-slate-400">
                      Elapsed: {activeDeployment.duration || 0}s
                    </span>
                  )}
                </div>

                <div className="bg-[#02050f]/80 p-5 font-mono text-xs text-slate-300 h-80 overflow-y-auto space-y-1.5">
                  {activeDeployment ? (
                    <>
                      <div className="p-3 bg-indigo-950/20 border-l-2 border-indigo-500 rounded text-[11px] mb-3 text-slate-300 space-y-1">
                        <div>
                          <span className="text-slate-500 uppercase text-[9px] block">Pipeline:</span>
                          <span className="text-indigo-400 font-bold">{activeDeployment.repoName} [{activeDeployment.branch}]</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase text-[9px] block">Commit:</span>
                          <span className="text-slate-200">
                            <code className="bg-slate-950 px-1.5 py-0.5 border border-slate-800 rounded text-[10px]">{activeDeployment.commitHash}</code> "{activeDeployment.commitMsg}"
                          </span>
                        </div>
                      </div>

                      {activeDeployment.logs.map((log, id) => (
                        <div key={id} className="leading-relaxed break-all">
                          {log}
                        </div>
                      ))}

                      {activeDeployment.status === "SUCCESS" && (
                        <div className="p-3 bg-emerald-950/20 text-emerald-400 rounded border border-emerald-900/30 font-sans text-[11px] mt-4">
                          🎉 Deploy concluído com extremo sucesso. Sua branch monitorada está online.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                      <Code className="h-10 w-10 text-slate-800 mb-2 fill-current" />
                      <p className="text-xs font-medium">Nenhum pipeline ativo em exibição.</p>
                      <p className="text-[10px] text-slate-600">Dispare um fluxo de commit na aba Workspace para ver compilações.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs bottom selection logs lists */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex border-b border-slate-800 pb-2 justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInfoTab("deployments")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${infoTab === "deployments" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Processos de Deploys ({serverState.deployments.length})
                    </button>
                    <button
                      onClick={() => setInfoTab("webhooks")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${infoTab === "webhooks" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Webhooks Recebidos ({serverState.webhooks.length})
                    </button>
                    <button
                      onClick={() => setInfoTab("setup")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${infoTab === "setup" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      <Settings className="h-3 w-3" /> Manual de Integração / Ajuda
                    </button>
                  </div>
                </div>

                {infoTab === "deployments" && (
                  <div className="space-y-2">
                    {serverState.deployments.map((dep) => (
                      <div
                        key={dep.id}
                        onClick={() => setActiveDeploymentId(dep.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${activeDeploymentId === dep.id ? "bg-indigo-950/30 border-indigo-900" : "bg-slate-950/50 border-transparent hover:bg-slate-950"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2.5 w-2.5 rounded-full ${dep.status === "SUCCESS" ? "bg-emerald-500" : "bg-indigo-500 animate-spin"}`}></div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 block truncate">{dep.commitMsg}</span>
                            <span className="text-[10px] text-slate-400">por {dep.author} • {dep.commitHash}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(dep.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}

                    {serverState.deployments.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-6">
                        Nenhum deploy monitorado. Crie um commit na aba do Workspace!
                      </p>
                    )}
                  </div>
                )}

                {infoTab === "webhooks" && (
                  <div className="space-y-4">
                    {serverState.webhooks.map((wh) => (
                      <div key={wh.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                        <span className="text-xs font-mono font-bold text-slate-300 block mb-1">
                          Ref: {wh.payload.ref}
                        </span>
                        <pre className="text-[10px] font-mono text-slate-500 select-all overflow-x-auto p-2 bg-slate-950/50">
                          {JSON.stringify(wh.payload.commits?.[0] || {}, null, 2)}
                        </pre>
                      </div>
                    ))}

                    {serverState.webhooks.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-6">
                        Nenhum payload de webhook recebido ainda.
                      </p>
                    )}
                  </div>
                )}

                {infoTab === "setup" && (
                  <div className="space-y-4 text-xs leading-relaxed text-slate-350 bg-[#090b11] p-1 rounded-xl">
                    <div className="border bg-slate-950/50 border-slate-800/80 p-5 rounded-xl space-y-4">
                      <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" /> Método Recomendado: Token de Acesso Pessoal (PAT)
                      </h4>
                      <p className="font-light text-slate-450 leading-normal">
                        Este método é o mais rápido, não requer configurar chaves de aplicativo OAuth no seu ambiente local do AI Studio e funciona instantaneamente!
                      </p>
                      <ol className="list-decimal pl-5 space-y-2 text-slate-400">
                        <li>
                          Acesse sua conta do GitHub e vá em{" "}
                          <a
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Settings &gt; Developer Settings &gt; Personal Access Tokens &gt; Tokens (classic) <ExternalLink className="h-3 w-3" />
                          </a>.
                        </li>
                        <li>Clique em <strong>Generate new token &gt; Generate new token (classic)</strong>.</li>
                        <li>Dê uma descrição ao token (ex: <i>GitKraken Client Studio</i>) e marque os escopos <b>repo</b> e <b>user</b>.</li>
                        <li>Clique em <strong>Generate token</strong> e copie a chave binária gerada (que inicia com <code>ghp_</code>).</li>
                        <li>Cole o token diretamente no campo de texto <b>Cole seu token (PAT)</b> na barra lateral esquerda desta aba "CI/CD Integrado"!</li>
                      </ol>
                    </div>

                    <div className="border bg-slate-950/50 border-slate-800/80 p-5 rounded-xl space-y-4 font-normal">
                      <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Método Alternativo: Configurando chaves de aplicativo OAuth no AI Studio (.env)
                      </h4>
                      <p className="font-light text-slate-450">
                        Se você deseja permitir login automático através de popup usando o botão "Conectar via GitHub OAuth":
                      </p>
                      
                      <div className="bg-[#0d0f17]/90 border border-indigo-950/40 p-4 rounded-xl space-y-3">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 block font-bold">1. URL de Callback de Redirecionamento Necessária</span>
                        <p className="text-[11px] text-slate-400">
                          Configure esse link exatamente como o <b>Authorization callback URL</b> na criação do seu OAuth App no GitHub:
                        </p>
                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg">
                          <code className="text-emerald-400 text-[10px] break-all select-all font-mono flex-1">
                            {serverState.redirectUri}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(serverState.redirectUri);
                              setCopiedText(true);
                              setTimeout(() => setCopiedText(false), 2000);
                            }}
                            className="bg-indigo-950/40 border border-indigo-900/60 text-slate-350 hover:text-white p-1.5 rounded transition cursor-pointer flex items-center justify-center"
                            title="Copiar Callback URL"
                          >
                            {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <ol className="list-decimal pl-5 space-y-2 text-slate-400">
                        <li>
                          Vá em seu perfil GitHub em{" "}
                          <a
                            href="https://github.com/settings/developers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Settings &gt; Developer settings &gt; OAuth Apps &gt; New OAuth App <ExternalLink className="h-3 w-3" />
                          </a>.
                        </li>
                        <li>Preencha qualquer nome de app.</li>
                        <li>
                          Defina a <b>Homepage URL</b> com o endereço base do seu app e a <b>Authorization callback URL</b> com o link copiado logo acima.
                        </li>
                        <li>Clique em <b>Register application</b>.</li>
                        <li>
                          Gere uma <b>Client Secret</b>. Copie o <b>Client ID</b> e o <b>Client Secret</b> gerados.
                        </li>
                        <li>
                          No menu de segredos/configurações do AI Studio (painel "Secrets/Settings" no topo), declare as duas variáveis de ambiente correspondentes:
                          <ul className="list-disc pl-5 mt-1.5 space-y-1 font-mono text-[10px] text-indigo-400 font-bold">
                            <li>GITHUB_CLIENT_ID="seu_client_id_aqui"</li>
                            <li>GITHUB_CLIENT_SECRET="seu_client_secret_aqui"</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* --- TAB C: GRANULAR REAL-TIME ANALYTICS DASHBOARD --- */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard
            isLightTheme={isLightTheme}
            repositories={repositories}
            selectedRepoIdSim={selectedRepoIdSim}
            deployments={serverState.deployments}
            webhooks={serverState.webhooks}
            onExecuteCommand={handleCommandLineExec}
            repoStats={repoStats}
          />
        )}

      </main>

      {/* Aesthetic Footer credited rules */}
      <footer className="border-t border-slate-950 bg-slate-950/40 py-6 mt-auto text-center text-xs text-slate-600 font-light select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p>Motor de representação gráfica por gráficos vetoriais SVG e manipulação de árvore de nós.</p>
          <p>© 2026 GitKraken Studio Client Dashboard & Build Pipelines. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Dynamic Toast Alerts System */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-2.5 p-4 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl animate-pulse select-none">
          {toast.type === "success" && (
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          )}
          {toast.type === "error" && (
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
          )}
          {toast.type === "info" && (
            <div className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
          )}
          <p className="text-xs font-semibold font-sans leading-normal text-slate-200 pr-1">{toast.message}</p>
          <button 
            onClick={() => setToast(null)} 
            className="text-slate-550 hover:text-white font-bold text-xs pl-2 transition"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
