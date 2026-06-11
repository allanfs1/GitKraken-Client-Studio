import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

let aiClientInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada. Insira sua chave nas Configurações > Segredos.");
  }
  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClientInstance;
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;

app.use(express.json());

// In-memory or file-backed database state path
const DB_PATH = path.join(process.cwd(), "db.json");

interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  stars: number;
  branch: string;
}

interface Deployment {
  id: string;
  repoName: string;
  branch: string;
  commitHash: string;
  commitMsg: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  duration: number; // seconds
  status: "SUCCESS" | "FAILED" | "BUILDING" | "QUEUED";
  logs: string[];
  triggerType: "WEBHOOK" | "MANUAL";
}

interface WebhookLog {
  id: string;
  receivedAt: string;
  headers: any;
  payload: any;
}

interface DBState {
  token: string | null;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    name: string;
  } | null;
  connectedRepo: Repo | null;
  deployments: Deployment[];
  webhooks: WebhookLog[];
}

// Initial default state
let state: DBState = {
  token: null,
  user: null,
  connectedRepo: null,
  deployments: [],
  webhooks: [],
};

// Load state from file if exists
const loadState = () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      state = JSON.parse(data);
    }
  } catch (error) {
    console.error("Erro ao ler db.json, usando estado em memória:", error);
  }
};

// Save state to file
const saveState = () => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar db.json:", error);
  }
};

loadState();

// Helper to generate a random hash
const generateHash = (len = 7) => {
  const chars = "abcdef0123456789";
  let hash = "";
  for (let i = 0; i < len; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

// Helper simulation runner for progressive build logs
const runDeploymentBuild = (deploymentId: string) => {
  const buildProgress = [
    { delay: 1000, log: "⏳ [00:01] Inicializando pipeline de deploy virtual..." },
    { delay: 3000, log: "📥 [00:03] Clonando repositório do GitHub (branch principal)..." },
    { delay: 5000, log: "🔐 [00:05] Chaves SSH e autenticação validadas com sucesso." },
    { delay: 7000, log: "📦 [00:07] Instalando pacotes e dependências (npm install)..." },
    { delay: 10000, log: "⚙️ [00:10] Executando análise estática linter..." },
    { delay: 13000, log: "🧪 [00:13] Rodando testes unitários (npm run test)..." },
    { delay: 15000, log: "✅ [00:15] Todo o conjunto de testes passou com sucesso! (18 testes OK)" },
    { delay: 17000, log: "🚀 Compilando componentes React para produção (npm run build)..." },
    { delay: 20000, log: "⚡ Minimizando bundle JS e gerando hash de compilação..." },
    { delay: 22000, log: "📂 Enviando arquivos compilados para o servidor CDN distribuído..." },
    { delay: 24000, log: "🌐 Configurando rotas reversas de rede nos contêineres e DNS..." },
    { delay: 25000, log: "🎉 [SUCCESS] Novo contêiner de produção está ONLINE!" },
  ];

  let currentStep = 0;

  // Set initial status to BUILDING
  const findAndModify = (status: "SUCCESS" | "FAILED" | "BUILDING", logLine?: string) => {
    const dep = state.deployments.find((d) => d.id === deploymentId);
    if (dep) {
      dep.status = status;
      if (logLine) {
        dep.logs.push(logLine);
      }
      saveState();
    }
  };

  findAndModify("BUILDING", "🚦 [00:00] Deployment colocado na fila de processamento.");

  const stepTimer = () => {
    if (currentStep < buildProgress.length) {
      const step = buildProgress[currentStep];
      setTimeout(() => {
        findAndModify("BUILDING", step.log);
        currentStep++;
        stepTimer();
      }, 1500 + Math.random() * 800); // realistic delays
    } else {
      // Completed!
      const dep = state.deployments.find((d) => d.id === deploymentId);
      if (dep) {
        dep.status = "SUCCESS";
        dep.duration = Math.floor((Date.now() - new Date(dep.timestamp).getTime()) / 1000);
        saveState();
      }
    }
  };

  setTimeout(stepTimer, 1000);
};

// API: Get app state & configuration
app.get("/api/state", (req, res) => {
  res.json({
    hasOAuthKeys: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    connected: !!state.token,
    user: state.user,
    connectedRepo: state.connectedRepo,
    deployments: state.deployments,
    webhooks: state.webhooks,
    redirectUri: `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`,
  });
});

// API: Submit personal access token directly
app.post("/api/github/token", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token é obrigatório" });
  }

  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    if (!userRes.ok) {
      throw new Error(`Prefixo do GitHub inválido: ${userRes.statusText}`);
    }

    const userData = await userRes.json();

    state.token = token;
    state.user = {
      login: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      name: userData.name || userData.login,
    };
    saveState();

    res.json({ success: true, user: state.user });
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Erro de autenticação com o token inserido." });
  }
});

// API: Fetch GitHub client repositories (uses saved token)
app.get("/api/github/repos", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }

  try {
    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    if (!reposRes.ok) {
      throw new Error("Não foi possível acessar seus repositórios no GitHub");
    }

    const reposData = await reposRes.json();
    const formattedRepos = reposData.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description || "Sem descrição disponível.",
      language: r.language || "TypeScript",
      stars: r.stargazers_count,
    }));

    res.json(formattedRepos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Falha ao consultar repositórios do GitHub." });
  }
});

// API: Fetch GitHub API Pull Requests for a repository
app.get("/api/github/pulls", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }
  const { repo } = req.query;
  if (!repo) {
    return res.status(400).json({ error: "Repositório não fornecido" });
  }

  try {
    const pullsRes = await fetch(`https://api.github.com/repos/${repo}/pulls?state=all&per_page=50`, {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    if (!pullsRes.ok) throw new Error("Erro ao carregar Pull Requests");
    const pullsData = await pullsRes.json();
    const formattedPulls = pullsData.map((pr: any) => ({
      id: `pr-${pr.number}`,
      number: pr.number,
      title: pr.title,
      description: pr.body || "Sem descrição",
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      status: pr.state === "open" ? "Open" : pr.merged_at ? "Merged" : "Closed",
      author: pr.user.login,
      avatarUrl: pr.user.avatar_url,
      date: new Date(pr.created_at).toLocaleDateString("pt-BR"),
      html_url: pr.html_url,
      comments: [] // Minimal mapping
    }));
    res.json(formattedPulls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Fetch GitHub API Issues for a repository
app.get("/api/github/issues", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }
  const { repo } = req.query;
  if (!repo) {
    return res.status(400).json({ error: "Repositório não fornecido" });
  }

  try {
    const issuesRes = await fetch(`https://api.github.com/repos/${repo}/issues?state=all&per_page=50`, {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    if (!issuesRes.ok) throw new Error("Erro ao carregar Issues");
    const issuesData = await issuesRes.json();
    // Issues API also returns pull requests, filter them out
    const onlyIssues = issuesData.filter((issue: any) => !issue.pull_request);
    
    const formattedIssues = onlyIssues.map((issue: any) => ({
      id: `ISSUE-${issue.number}`,
      number: issue.number,
      title: issue.title,
      description: issue.body || "Sem descrição",
      status: issue.state === "open" ? "To Do" : "Done",
      assignee: issue.assignee?.login || "Unassigned",
      html_url: issue.html_url,
      user_avatar: issue.user?.avatar_url,
      comments: [] // Minimal mapping
    }));
    res.json(formattedIssues);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Fetch Server System Metrics
app.get("/api/system/metrics", (req, res) => {
  const heapUsedMB = process.memoryUsage().heapUsed / 1024 / 1024;
  const heapTotalMB = process.memoryUsage().heapTotal / 1024 / 1024;
  const loadAvg = os.loadavg()[0]; // 1 minute load average
  const uptimeSeconds = process.uptime();
  
  res.json({
    heapUsedMB: Math.round(heapUsedMB * 100) / 100,
    heapTotalMB: Math.round(heapTotalMB * 100) / 100,
    cpuLoad: Math.round(loadAvg * 100) / 100,
    uptime: uptimeSeconds
  });
});

// API: Fetch GitHub repo languages and stats
app.get("/api/github/repo-stats", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }
  const { repo } = req.query;
  if (!repo) {
    return res.status(400).json({ error: "Repositório não fornecido" });
  }

  try {
    const langRes = await fetch(`https://api.github.com/repos/${repo}/languages`, {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });
    
    let languages = {};
    if (langRes.ok) {
      languages = await langRes.json();
    }

    const trafficRes = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    let extraStats = { forks: 0, open_issues: 0, network_count: 0, subscribers_count: 0 };
    if (trafficRes.ok) {
      const data = await trafficRes.json();
      extraStats = {
        forks: data.forks_count,
        open_issues: data.open_issues_count,
        network_count: data.network_count,
        subscribers_count: data.subscribers_count,
      };
    }

    res.json({ languages, ...extraStats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Fetch GitHub branches for a repository
app.get("/api/github/branches", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }
  const { repo } = req.query;
  if (!repo) {
    return res.status(400).json({ error: "Repositório não fornecido" });
  }

  try {
    const branchesRes = await fetch(`https://api.github.com/repos/${repo}/branches?per_page=50`, {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    if (!branchesRes.ok) {
      throw new Error(`Erro ao buscar branches: ${branchesRes.statusText}`);
    }

    const branchesData = await branchesRes.json();
    const branches = branchesData.map((b: any) => b.name);
    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao carregar branches do repositório." });
  }
});

// API: Fetch GitHub commits for a repository
app.get("/api/github/commits", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }
  const { repo, branch } = req.query;
  if (!repo) {
    return res.status(400).json({ error: "Repositório não fornecido" });
  }

  try {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${repo}/commits?sha=${branch || "main"}&per_page=100`,
      {
        headers: {
          Authorization: `token ${state.token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitDeploy-Applet",
        },
      }
    );

    if (!commitsRes.ok) {
      throw new Error(`Erro ao buscar commits: ${commitsRes.statusText}`);
    }

    const commitsData = await commitsRes.json();
    const formattedCommits = commitsData.map((c: any) => ({
      sha: c.sha.substring(0, 7),
      parents: c.parents.map((p: any) => p.sha.substring(0, 7)),
      message: c.commit.message,
      author: c.commit.author.name,
      email: c.commit.author.email,
      date: new Date(c.commit.author.date).toLocaleDateString("pt-BR"),
      branch: branch || "main",
      avatarUrl: c.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop"
    }));

    res.json(formattedCommits);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao carregar commits do repositório." });
  }
});

// API: Fetch GitHub commit detail and files for a repository
app.get("/api/github/commit-detail", async (req, res) => {
  if (!state.token) {
    return res.status(401).json({ error: "GitHub não conectado" });
  }
  const { repo, sha } = req.query;
  if (!repo || !sha) {
    return res.status(400).json({ error: "Parâmetros em falta" });
  }

  try {
    const detailRes = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    if (!detailRes.ok) {
      throw new Error(`Erro ao obter commit: ${detailRes.statusText}`);
    }

    const detailData = await detailRes.json();
    const files = (detailData.files || []).map((f: any) => ({
      filepath: f.filename,
      status: f.status === "added" ? "added" : f.status === "removed" ? "deleted" : "modified",
      additions: f.additions,
      deletions: f.deletions,
      diff: f.patch || "Nenhuma modificação de diferença visível disponível (arquivo grande, binário ou renomeado)."
    }));

    res.json({
      sha: detailData.sha.substring(0, 7),
      message: detailData.commit.message,
      author: detailData.commit.author.name,
      avatarUrl: detailData.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
      files
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao carregar detalhes do commit selecionado." });
  }
});

// API: Connect a specific repository to watch/track
app.post("/api/repositories/connect", async (req, res) => {
  const { repo, branch } = req.body;
  if (!repo) {
    return res.status(400).json({ error: "Repositório não informado" });
  }

  state.connectedRepo = {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stars,
    branch: branch || "main",
  };
  saveState();

  res.json({ success: true, connectedRepo: state.connectedRepo });
});

// API: Disconnect GitHub and clear repo configuration
app.post("/api/repositories/disconnect", (req, res) => {
  state.token = null;
  state.user = null;
  state.connectedRepo = null;
  saveState();
  res.json({ success: true });
});

// API: Trigger a manual compilation deployment
app.post("/api/deployments/trigger", async (req, res) => {
  if (!state.connectedRepo) {
    return res.status(400).json({ error: "Nenhum repositório conectado" });
  }

  let commitHash = generateHash(7);
  let commitMsg = "Compilação manual desencadeada pelo painel";
  let author = state.user?.name || "Desenvolvedor";
  let authorAvatar = state.user?.avatar_url || "";

  // Attempt to fetch actual latest commits from GitHub to make it 100% REAL!
  if (state.token && state.connectedRepo) {
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${state.connectedRepo.full_name}/commits?sha=${state.connectedRepo.branch}&per_page=1`,
        {
          headers: {
            Authorization: `token ${state.token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "GitDeploy-Applet",
          },
        }
      );
      if (commitRes.ok) {
        const commits = await commitRes.json();
        if (Array.isArray(commits) && commits.length > 0) {
          commitHash = commits[0].sha.substring(0, 7);
          commitMsg = commits[0].commit.message;
          author = commits[0].commit.author.name;
          authorAvatar = commits[0].author?.avatar_url || "";
        }
      }
    } catch (_) {
      // Silently fall back to generated commit
    }
  }

  const newDeployment: Deployment = {
    id: "dep_" + Date.now(),
    repoName: state.connectedRepo.full_name,
    branch: state.connectedRepo.branch,
    commitHash,
    commitMsg,
    author,
    authorAvatar,
    timestamp: new Date().toISOString(),
    duration: 0,
    status: "QUEUED",
    logs: [],
    triggerType: "MANUAL",
  };

  state.deployments.unshift(newDeployment);
  saveState();

  runDeploymentBuild(newDeployment.id);

  res.json({ success: true, deployment: newDeployment });
});

// API: Setup OAuth state & login URL
app.get("/api/auth/github/url", (req, res) => {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirect_uri = `${appUrl}/auth/callback`;

  if (!client_id) {
    return res.status(550).json({ error: "Contrato de ID de aplicativo GitHub não configurado (.env)" });
  }

  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
    redirect_uri
  )}&scope=repo,user`;

  res.json({ url: oauthUrl });
});

// OAuth Callback Endpoint (handles redirect inside the popup window)
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.send(`
      <html>
        <body>
          <script>
            window.close();
          </script>
          <p>Erro ao conectar com GitHub. Sem código fornecido.</p>
        </body>
      </html>
    `);
  }

  try {
    // Exchange authorize code for access_token on server-side (SECURE!)
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data: any = await response.json();
    const token = data.access_token;

    if (!token) {
      throw new Error(data.error_description || "Falha ao obter token de acesso");
    }

    // Retrieve user profile data
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitDeploy-Applet",
      },
    });

    const userData = await userRes.json();

    state.token = token;
    state.user = {
      login: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      name: userData.name || userData.login,
    };
    saveState();

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação efetuada com sucesso! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Erro no fluxo do callback OAuth:", error);
    res.send(`
      <html>
        <body>
          <p>Erro na conexão com o GitHub: ${error.message || error}. Verifique suas chaves de ambiente.</p>
          <button onclick="window.close()">Voltar ao console</button>
        </body>
      </html>
    `);
  }
});

// GITHUB LIVE WEBHOOK: Real endpoint receiving webhook from GitHub repositories!
app.post("/api/webhooks/github", (req, res) => {
  const headers = req.headers;
  const payload = req.body;

  const webhookId = "wh_" + Date.now();
  const newLog: WebhookLog = {
    id: webhookId,
    receivedAt: new Date().toISOString(),
    headers,
    payload,
  };

  state.webhooks.unshift(newLog);

  // Parse commit info if we have a push event
  const isPush = headers["x-github-event"] === "push";
  let branchName = "";
  if (payload.ref) {
    branchName = payload.ref.replace("refs/heads/", "");
  }

  const watchRepo = state.connectedRepo;

  // Let's print out and execute CI/CD build dynamically IF the repo and branch are tracked!
  if (isPush && watchRepo && payload.repository && payload.repository.full_name === watchRepo.full_name) {
    // Only check branch if specified, but usually main/master
    const matchesBranch = !watchRepo.branch || branchName === watchRepo.branch;

    if (matchesBranch) {
      const commits = payload.commits || [];
      const latestCommit = commits[0] || {};
      const commitHash = latestCommit.id ? latestCommit.id.substring(0, 7) : generateHash(7);
      const commitMsg = latestCommit.message || `Compilação de código automática via push`;
      const author = latestCommit.author?.name || payload.pusher?.name || "GitHub Push";
      const authorAvatar = payload.sender?.avatar_url || "";

      const automatedDep: Deployment = {
        id: "dep_wh_" + Date.now(),
        repoName: watchRepo.full_name,
        branch: branchName,
        commitHash,
        commitMsg,
        author,
        authorAvatar,
        timestamp: new Date().toISOString(),
        duration: 0,
        status: "QUEUED",
        logs: [],
        triggerType: "WEBHOOK",
      };

      state.deployments.unshift(automatedDep);
      runDeploymentBuild(automatedDep.id);
    }
  }

  // Cap webhooks list at 30 to prevent memory bloating
  if (state.webhooks.length > 30) {
    state.webhooks = state.webhooks.slice(0, 30);
  }
  saveState();

  res.json({ success: true, message: "Webhook registrado e processado pelo Pipeline GitDeploy." });
});

// API: Clear Logs and Histories
app.post("/api/webhooks/clear", (req, res) => {
  state.webhooks = [];
  saveState();
  res.json({ success: true });
});

app.post("/api/deployments/clear", (req, res) => {
  state.deployments = [];
  saveState();
  res.json({ success: true });
});

// API: Gemini - Generate Commit Message
app.post("/api/gemini/generate-commit-msg", async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.json({ message: "feat: update project configuration" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Gere uma mensagem de commit de Git curta e profissional em português para as seguintes alterações de arquivo:\n${files.map((f: any) => `- Arquivo: ${f.filepath}, Status: ${f.status}\nDiff:\n${f.diff}`).join("\n")}\nRetorne apenas a mensagem de commit gerada, sem aspas, marcas de assunto especiais ou formatação de código markdown extra.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ message: response.text?.trim() || "feat: atualiza arquivos do projeto" });
  } catch (error: any) {
    console.error("Gemini commit message error:", error);
    res.json({ error: error.message || "Erro ao conectar com Gemini" });
  }
});

// API: Gemini - Explain Commit
app.post("/api/gemini/explain-commit", async (req, res) => {
  const { message, author, date, diffs } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `Explique o que este commit faz de forma clara, técnica e estruturada em português.
Autor: ${author || "N/A"}
Data: ${date || "N/A"}
Mensagem: ${message || "N/A"}
Arquivos e Diffs:\n${diffs || "Sem diffs fornecidos."}
Forneça a explicação estruturada com tópicos e uma descrição geral em markdown.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ explanation: response.text?.trim() || "Falha ao gerar explicação." });
  } catch (error: any) {
    console.error("Gemini explain commit error:", error);
    res.json({ error: error.message || "Erro ao conectar com Gemini" });
  }
});

// API: Gemini - Explain Code (GitLens style)
app.post("/api/gemini/explain-code", async (req, res) => {
  const { filepath, code, selectedLines } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `Explique de forma detalhada e simplificada o seguinte snippet de código do arquivo '${filepath || "Inexistente"}'.
Linhas selecionadas: ${selectedLines || "Todas as linhas"}
Snippet:\n\`\`\`\n${code || ""}\n\`\`\`
Forneça uma explicação curta, destacando a complexidade, as nuances do código e possíveis melhorias. Retorne em markdown em português.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ explanation: response.text?.trim() || "Nenhuma explicação disponível." });
  } catch (error: any) {
    console.error("Gemini explain code error:", error);
    res.json({ error: error.message || "Erro ao conectar com Gemini" });
  }
});

// API: Gemini - Review Pull Request
app.post("/api/gemini/review-pr", async (req, res) => {
  const { title, description, sourceBranch, targetBranch, files } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `Realize uma revisão de código profissional (Code Review) para o seguinte Pull Request:
Título: ${title || "N/A"}
Descrição: ${description || "N/A"}
De: ${sourceBranch || "N/A"} -> Para: ${targetBranch || "N/A"}
Arquivos alterados:\n${(files || []).map((f: any) => `- ${f.filepath} (${f.status})\nDiff:\n${f.diff}`).join("\n")}

Retorne em Markdown estruturado em português contendo:
1. Resumo Automático das alterações.
2. Análise de Qualidade (pontualidade, possíveis bugs, boas práticas).
3. Sugestões de Melhorias ou aprovação com comentários construtivos.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ review: response.text?.trim() || "PR Review indisponível no momento." });
  } catch (error: any) {
    console.error("Gemini PR review error:", error);
    res.json({ error: error.message || "Erro ao conectar com Gemini" });
  }
});

// Vite middleware configuration or Production fallback
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving statically compile output
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GitDeploy server active at http://localhost:${PORT}`);
  });
}

bootServer();
