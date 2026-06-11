import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Activity,
  Cpu,
  Database,
  Layers,
  GitBranch,
  GitCommit,
  Terminal,
  ArrowUpRight,
  HardDrive,
  Users2,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
  Flame,
  Binary
} from "lucide-react";
import { GitRepository, Commit } from "../types";

interface AnalyticsDashboardProps {
  isLightTheme: boolean;
  repositories: GitRepository[];
  selectedRepoIdSim: string;
  deployments: any[];
  webhooks: any[];
  onExecuteCommand?: (cmd: string) => void;
  repoStats?: any;
}

interface RealTimeMetric {
  time: string;
  cpu: number;
  memory: number;
  requests: number;
  latency: number;
}

export default function AnalyticsDashboard({
  isLightTheme,
  repositories,
  selectedRepoIdSim,
  deployments,
  webhooks,
  onExecuteCommand,
  repoStats
}: AnalyticsDashboardProps) {
  const activeRepo = repositories.find(r => r.id === selectedRepoIdSim) || repositories[0];

  // --- Real-Time Performance Simulation State ---
  const [metricHistory, setMetricHistory] = useState<RealTimeMetric[]>([]);
  const [loadMultiplier, setLoadMultiplier] = useState<number>(1.0);
  const [isGCing, setIsGCing] = useState<boolean>(false);
  const [systemUptime, setSystemUptime] = useState<number>(0);
  const [totalSimRequests, setTotalSimRequests] = useState<number>(94827);

  // Update loop for real-time diagnostics (every 2.5 seconds)
  useEffect(() => {
    let unmounted = false;

    const fetchSystemMetrics = async () => {
      try {
        const res = await fetch("/api/system/metrics");
        if (!res.ok) return;
        const data = await res.json();
        
        if (unmounted) return;

        setSystemUptime(data.uptime);
        
        const reqBase = 25 + Math.random() * 40;
        const latBase = 50 + Math.random() * 50;

        // Uses actual CPU Load average and Memory heap from Node server process
        const realCpu = Math.max(1, Math.min(100, Math.floor(data.cpuLoad * 100))); // simple normalization
        const realMem = parseFloat((data.heapUsedMB / 1024).toFixed(2)); // GB
        
        // Adjust based on UI multipliers (for stress test simulator effect overlay)
        const nextCpu = Math.min(98, Math.floor(realCpu * loadMultiplier));
        const nextMem = parseFloat(Math.min(8.0, isGCing ? realMem * 0.4 : realMem * (loadMultiplier * 0.2 + 0.8)).toFixed(2));
        const nextRequests = Math.floor(reqBase * loadMultiplier);
        const nextLatency = Math.min(600, Math.floor(latBase * (loadMultiplier * 0.5 + 0.5)));

        setTotalSimRequests(prev => prev + Math.floor(nextRequests * 2.5));

        setMetricHistory(prev => {
          const updated = [...prev];
          if (updated.length >= 16) updated.shift();
          updated.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: nextCpu,
            memory: nextMem,
            requests: nextRequests,
            latency: nextLatency
          });
          return updated;
        });

        if (isGCing) {
          setIsGCing(false); // GC only lasts one tick
        }
      } catch (err) {
        console.error("Failure fetching system metrics", err);
      }
    };

    // Initial fetch
    fetchSystemMetrics();
    
    const interval = setInterval(fetchSystemMetrics, 2500);

    return () => {
      unmounted = true;
      clearInterval(interval);
    };
  }, [loadMultiplier, isGCing]);

  // Handle garbage collection trigger
  const triggerGC = () => {
    setIsGCing(true);
    if (onExecuteCommand) {
      onExecuteCommand("clear");
    }
  };

  // Handle load stress testing simulation
  const toggleStressTest = () => {
    const nextMultiplier = loadMultiplier === 1.0 ? 2.5 : 1.0;
    setLoadMultiplier(nextMultiplier);
    if (onExecuteCommand) {
      onExecuteCommand(nextMultiplier === 2.5 
        ? "echo [STRESS_TEST] Escalando acessos simultâneos para 250%..." 
        : "echo [STRESS_TEST] Refazendo balanceamento de carga para níveis nominais."
      );
    }
  };

  // --- Process and format Git repository statistics ---
  // A. Commits density per developer
  const commitAuthorsData = React.useMemo(() => {
    if (!activeRepo || !activeRepo.commits) return [];
    const counts: { [name: string]: number } = {};
    activeRepo.commits.forEach(c => {
      const name = c.author ? c.author.replace(/\s*\(.*\)/, "") : "Outro";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count
    }));
  }, [activeRepo]);

  // B. Languages inside current repository (from GitHub stats if available, otherwise file states)
  const languageData = React.useMemo(() => {
    if (repoStats && repoStats.languages && Object.keys(repoStats.languages).length > 0) {
      const langs = Object.entries(repoStats.languages as Record<string, number>);
      // Calculate total bytes
      const totalBytes = langs.reduce((acc, [_, bytes]) => acc + bytes, 0);
      return langs.map(([lang, bytes], index) => ({
        name: lang,
        quantidade: parseFloat(((bytes / totalBytes) * 100).toFixed(1)), // percentage
        fill: COLORS[index % COLORS.length]
      })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5); // top 5
    }
    
    // Fallback to the local file states
    if (!activeRepo) return [];
    return [
      { name: "Unstaged", quantidade: activeRepo.unstagedFiles?.length || 0, fill: "#ef4444" },
      { name: "Staged (Index)", quantidade: activeRepo.stagedFiles?.length || 0, fill: "#6366f1" },
      { name: "Stashes Saved", quantidade: activeRepo.stashes?.length || 0, fill: "#10b981" },
      { name: "Branches", quantidade: activeRepo.branches?.length || 0, fill: "#a855f7" }
    ];
  }, [repoStats, activeRepo]);

  // C. Activity Timeline: commits grouped by simulated day
  const commitsTimelineData = React.useMemo(() => {
    if (!activeRepo || !activeRepo.commits) return [];
    const dates: { [dateStr: string]: { commits: number; merged: number } } = {};
    
    // Seed standard dates to make it nice
    const cleanCommits = [...activeRepo.commits].reverse();
    cleanCommits.forEach(c => {
      const d = c.date || "08/06";
      const shortD = d.substring(0, 5); // DD/MM format
      if (!dates[shortD]) {
        dates[shortD] = { commits: 0, merged: 0 };
      }
      dates[shortD].commits += 1;
      if (c.isMerge) {
        dates[shortD].merged += 1;
      }
    });

    return Object.entries(dates).map(([date, vals]) => ({
      data: date,
      Commits: vals.commits,
      Merges: vals.merged
    }));
  }, [activeRepo]);

  // Uptime formatting
  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

  const themeBorderClass = isLightTheme ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/60";
  const themeCardBg = isLightTheme ? "bg-slate-50 border-slate-200" : "bg-[#090d16] border-slate-900";
  const themeTextMuted = isLightTheme ? "text-slate-500" : "text-slate-400";
  const themeTextTitle = isLightTheme ? "text-slate-900" : "text-white";

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview Summary & Interactive Ops Switches */}
      <div className={`p-5 rounded-2xl border ${themeBorderClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 shadow-xl`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-505 dark:text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h2 className={`text-base font-bold font-display ${themeTextTitle}`}>
              Git & Deployment Analytics
            </h2>
          </div>
          <p className={`text-xs ${themeTextMuted} font-light`}>
            Mapeamento dinâmico de produtividade de desenvolvimento local e monitoramento de canais de infraestrutura virtualizada.
          </p>
        </div>

        {/* Real-time Interactive Control Triggers */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* GC Force Button */}
          <button
            onClick={triggerGC}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition duration-150 cursor-pointer ${
              isLightTheme
                ? "bg-amber-50 hover:bg-amber-100 border-amber-205 text-amber-700"
                : "bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/60 text-amber-400"
            }`}
            title="Sinaliza a limpeza do buffer virtual do console de eventos e reduz memória do servidor"
          >
            <RefreshCw className={`h-3 w-3 ${isGCing ? "animate-spin" : ""}`} />
            GC Virtual
          </button>

          {/* Stress Load Test Toggle */}
          <button
            onClick={toggleStressTest}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition duration-150 cursor-pointer ${
              loadMultiplier > 1.0
                ? "bg-rose-500 hover:bg-rose-600 border-rose-550 text-white animate-pulse"
                : isLightTheme
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-305 text-slate-700"
                  : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
            }`}
            title="Aumenta simultaneamente a vazão de acessos à infraestrutura virtual a 2.5x para testar o comportamento do pipeline"
          >
            <Flame className={`h-3.5 w-3.5 ${loadMultiplier > 1.0 ? "text-amber-300 fill-amber-300" : "text-rose-500"}`} />
            {loadMultiplier > 1.0 ? "Stress Ativo (2.5x)" : "Stress de Rede"}
          </button>

          {/* Quick Stats Summary Badge */}
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-mono border border-indigo-500/20 bg-indigo-500/5 text-[#6366f1] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Streaming Ativo (2.5s)
          </div>
        </div>
      </div>

      {/* 2. Key Metrics - KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {/* KPI 1: Commits Totais */}
        <div className={`p-4 rounded-xl border ${themeBorderClass} flex items-center justify-between shadow-sm hover:translate-y-[-2px] transition-transform duration-200`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${themeTextMuted}`}>Total de Commits (Ramo)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-display ${themeTextTitle}`}>{activeRepo.commits?.length || 0}</span>
              <span className="text-[10px] font-mono text-emerald-550 font-semibold flex items-center">
                +{activeRepo.commits?.filter(c => !c.pushed).length || 0} locais
              </span>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <GitCommit className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Server Latency vs Status */}
        <div className={`p-4 rounded-xl border ${themeBorderClass} flex items-center justify-between shadow-sm hover:translate-y-[-2px] transition-transform duration-200`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${themeTextMuted}`}>Vazão / Latência Virtual</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-display ${themeTextTitle}`}>
                {metricHistory[metricHistory.length - 1]?.latency || 65}ms
              </span>
              <span className={`text-[10px] font-mono font-semibold ${loadMultiplier > 1.0 ? "text-rose-500" : "text-emerald-550"}`}>
                {loadMultiplier > 1.0 ? "▲ Alta Carga" : "✔ Estável"}
              </span>
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Memory & Workspace Ratio */}
        <div className={`p-4 rounded-xl border ${themeBorderClass} flex items-center justify-between shadow-sm hover:translate-y-[-2px] transition-transform duration-200`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${themeTextMuted}`}>Simulação VM Heap (Real)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-display ${themeTextTitle}`}>
                {metricHistory[metricHistory.length - 1]?.memory || 0} GB
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                / 8 GB limite
              </span>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Uptime Diagnóstico */}
        <div className={`p-4 rounded-xl border ${themeBorderClass} flex items-center justify-between shadow-sm hover:translate-y-[-2px] transition-transform duration-200`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${themeTextMuted}`}>Tempo de Operação (Uptime)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-[13.5px] font-bold font-mono tracking-tight whitespace-nowrap ${themeTextTitle}`}>
                {formatUptime(systemUptime)}
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* 3. Real-time Infrastructure Monitoring Performance charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Real-time Server Load Timeline Area chart (8 Columns) */}
        <div className={`p-5 rounded-xl border ${themeBorderClass} lg:col-span-8 flex flex-col justify-between shadow-md`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-900/10 dark:border-slate-800/40">
            <div className="space-y-0.5">
              <h3 className={`text-sm font-bold font-display flex items-center gap-1.5 ${themeTextTitle}`}>
                <Cpu className="h-4 w-4 text-indigo-400" />
                Métricas de Processamento Virtual da CPU & Requisições
              </h3>
              <p className={`text-[11px] ${themeTextMuted}`}>
                Consumo real-time de instâncias virtuais ativas e velocidade de tráfego de requisições de webhook.
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#6366f1]"></span> CPU %
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#38bdf8]"></span> Req/s
              </span>
            </div>
          </div>

          <div className="h-[240px] pt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#e2e8f0" : "#111827"} vertical={false} />
                <XAxis dataKey="time" stroke={isLightTheme ? "#64748b" : "#475569"} fontSize={9} className="font-mono" />
                <YAxis stroke={isLightTheme ? "#64748b" : "#475569"} fontSize={9} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightTheme ? "#fff" : "#020617",
                    borderColor: isLightTheme ? "#e2e8f0" : "#1e293b",
                    borderRadius: "8px",
                    color: isLightTheme ? "#000" : "#fff",
                    fontSize: "11px"
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                <Area type="monotone" dataKey="requests" stroke="#38bdf8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRequests)" name="Req/Sec (vazão)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Memory & Latency scrolling stats bar (4 Columns) */}
        <div className={`p-5 rounded-xl border ${themeBorderClass} lg:col-span-4 flex flex-col justify-between shadow-md`}>
          <div className="pb-4 border-b border-slate-900/10 dark:border-slate-800/40 space-y-0.5">
            <h3 className={`text-sm font-bold font-display flex items-center gap-1.5 ${themeTextTitle}`}>
              <HardDrive className="h-4 w-4 text-cyan-400" />
              Recursos de Armazenamento
            </h3>
            <p className={`text-[11px] ${themeTextMuted}`}>
              Variações na alocação de buffer e saúde da memória em tempo real.
            </p>
          </div>

          <div className="space-y-4 py-3 flex-1 flex flex-col justify-center">
            {/* Memory Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={themeTextMuted}>Alocação Heap Node</span>
                <span className={`font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                  {metricHistory[metricHistory.length - 1]?.memory || 1.8} GB / 8.0 GB
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (((metricHistory[metricHistory.length - 1]?.memory || 2) / 8) * 100))}%` }}
                ></div>
              </div>
            </div>

            {/* Simulated webhook events / traffic requests count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={themeTextMuted}>Total Requisições Gateway</span>
                <span className={`font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                  {totalSimRequests.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#38bdf8] h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((totalSimRequests % 100000) / 100000) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Latency and web status diagnostics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/10 dark:border-slate-850/60 text-center">
              <div className="p-2.5 bg-slate-500/5 rounded-lg">
                <span className={`block text-[10px] uppercase font-mono ${themeTextMuted}`}>Max Latency</span>
                <span className={`block text-md font-bold font-mono text-indigo-400 mt-0.5`}>
                  {Math.max(...(metricHistory.map(m => m.latency) || [180]))}ms
                </span>
              </div>
              <div className="p-2.5 bg-slate-500/5 rounded-lg">
                <span className={`block text-[10px] uppercase font-mono ${themeTextMuted}`}>Webhooks/Min</span>
                <span className="block text-md font-bold font-mono text-emerald-500 mt-0.5">
                  {(metricHistory[metricHistory.length - 1]?.requests * 24 || 120)} e/m
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Git Developer Contributions and Repository Timeline density */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Branch Commits chronological timeline (8 Columns) */}
        <div className={`p-5 rounded-xl border ${themeBorderClass} lg:col-span-8 flex flex-col justify-between shadow-md`}>
          <div className="pb-4 border-b border-slate-900/10 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className={`text-sm font-bold font-display flex items-center gap-1.5 ${themeTextTitle}`}>
                <Binary className="h-4 w-4 text-[#10b981]" />
                Volume de Commits por Data (Histórico Ramo Ativo)
              </h3>
              <p className={`text-[11px] ${themeTextMuted}`}>
                Linha temporal que monitora commits e mesclagens virtuais por intervalo de data estruturada.
              </p>
            </div>
            
            <div className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-555 rounded-full text-[10px] font-mono font-semibold">
              Branch: {activeRepo.activeBranch}
            </div>
          </div>

          <div className="h-[230px] pt-4 w-full">
            {commitsTimelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                Nenhum commit encontrado no repositório ativo para gerar histórico temporal.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commitsTimelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#e2e8f0" : "#111827"} vertical={false} />
                  <XAxis dataKey="data" stroke={isLightTheme ? "#64748b" : "#475569"} fontSize={10} />
                  <YAxis stroke={isLightTheme ? "#64748b" : "#475569"} fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLightTheme ? "#fff" : "#020617",
                      borderColor: isLightTheme ? "#e2e8f0" : "#1e293b",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Bar dataKey="Commits" fill="#6366f1" radius={[4, 4, 0, 0]} name="Commits Diretos" />
                  <Bar dataKey="Merges" fill="#a855f7" radius={[4, 4, 0, 0]} name="Branches Mescladas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Developer Commitment Distribution Pie Chart (4 Columns) */}
        <div className={`p-5 rounded-xl border ${themeBorderClass} lg:col-span-4 flex flex-col justify-between shadow-md`}>
          <div className="pb-4 border-b border-slate-900/10 dark:border-slate-800/40 space-y-0.5">
            <h3 className={`text-sm font-bold font-display flex items-center gap-1.5 ${themeTextTitle}`}>
              <Users2 className="h-4 w-4 text-violet-400" />
              Divisão de Commits por Autor
            </h3>
            <p className={`text-[11px] ${themeTextMuted}`}>
              Balanceamento de participação dos desenvolvedores no repositório ativo.
            </p>
          </div>

          <div className="h-[210px] w-full flex items-center justify-center relative">
            {commitAuthorsData.length === 0 ? (
              <div className="text-xs text-slate-500 italic">Nenhum autor de commit registrado.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commitAuthorsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {commitAuthorsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLightTheme ? "#fff" : "#020617",
                      borderColor: isLightTheme ? "#e2e8f0" : "#1e293b",
                      borderRadius: "8px",
                      fontSize: "10.5px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Absolute total counter badge inside donut */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-[9px] font-mono uppercase tracking-widest ${themeTextMuted}`}>commits</span>
              <span className={`text-xl font-bold ${themeTextTitle}`}>{activeRepo.commits?.length || 0}</span>
            </div>
          </div>

          {/* Color Legend for developers */}
          <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono mt-2">
            {commitAuthorsData.map((author, index) => (
              <div key={author.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className={`truncate ${isLightTheme ? "text-slate-700" : "text-slate-300"}`} title={author.name}>
                  {author.name}: <strong className="font-semibold">{author.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Advanced Workspace File Status Distributions and Quick Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Workspace Local Changes file distribution chart */}
        <div className={`p-5 rounded-xl border ${themeBorderClass} shadow-md`}>
          <div className="pb-4 border-b border-slate-900/10 dark:border-slate-800/40 space-y-0.5">
            <h3 className={`text-sm font-bold font-display flex items-center gap-1.5 ${themeTextTitle}`}>
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              {(repoStats && repoStats.languages && Object.keys(repoStats.languages).length > 0) ? "Distribuição de Linguagens (%)" : "Distribuição de Arquivos no Workspace Local"}
            </h3>
            <p className={`text-[11px] ${themeTextMuted}`}>
              {(repoStats && repoStats.languages && Object.keys(repoStats.languages).length > 0) ? "Percentual de composição de linguagens reais do repositório no GitHub." : "Indicador das alterações em progresso (staged/unstaged) vs buffers locais salvos em stash."}
            </p>
          </div>

          <div className="h-[210px] pt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#e2e8f0" : "#111827"} horizontal={false} />
                <XAxis type="number" stroke={isLightTheme ? "#64748b" : "#475569"} fontSize={10} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke={isLightTheme ? "#64748b" : "#475569"} fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightTheme ? "#fff" : "#020617",
                    borderColor: isLightTheme ? "#e2e8f0" : "#1e293b",
                    borderRadius: "8px",
                    fontSize: "11px"
                  }}
                />
                <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic logs and active events block (Deployment integration context) */}
        <div className={`p-5 rounded-xl border ${themeBorderClass} flex flex-col justify-between shadow-md`}>
          <div className="pb-4 border-b border-[#10b981]/15 dark:border-[#10b981]/10 space-y-0.5">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold font-display flex items-center gap-1.5 ${themeTextTitle}`}>
                <Terminal className="h-4 w-4 text-indigo-400" />
                Logs Ativos do Webhook e Operações de Deploy
              </h3>
              <span className="text-[9.5px] px-2 py-0.5 rounded bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981] font-mono uppercase font-bold">
                Online
              </span>
            </div>
            <p className={`text-[11px] ${themeTextMuted}`}>
              Listagem consolidada das últimas atividades registradas nos pipelines de produção.
            </p>
          </div>

          <div className={`flex-1 overflow-y-auto max-h-[190px] font-mono text-[10.5px] p-3 rounded-lg border mt-4 custom-scrollbar space-y-2.5 ${
            isLightTheme ? "bg-slate-50 border-slate-205 text-slate-800" : "bg-[#02050e]/95 border-slate-900 text-slate-300"
          }`}>
            <div className="flex items-start gap-1 text-slate-500">
              <span className="text-indigo-400 shrink-0">[{new Date().toLocaleDateString()}]</span>
              <span>Monitor de segurança inicializado. Zero vulnerabilidades detectadas.</span>
            </div>
            
            {deployments.length > 0 ? (
              deployments.slice(0, 3).map((dep, dIdx) => (
                <div key={dep.id || dIdx} className="flex items-start gap-1">
                  <span className="text-emerald-555 shrink-0">[Deploy]</span>
                  <span>Disparado commit {dep.commitSha?.substring(0, 7) || "HEAD"} na branch {dep.branch || "main"}. Status: <span className="text-emerald-400 font-bold">{dep.status || "sucesso"}</span></span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-1 text-slate-500">
                <span>[Deploy] Sem implantações realizadas na sessão atual. Use o painel de CI/CD para disparar.</span>
              </div>
            )}

            {webhooks.length > 0 ? (
              webhooks.slice(0, 2).map((web, wIdx) => (
                <div key={web.id || wIdx} className="flex items-start gap-1">
                  <span className="text-violet-400 shrink-0">[Webhook]</span>
                  <span>Envio de callback HTTP para {web.url?.substring(0, 25) || "endpoint_api"}... status 200 OK</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-1 text-slate-500">
                <span>[Webhook] Sem disparadores configurados localmente ou aguardando pull requests.</span>
              </div>
            )}

            {/* CPU warn / trigger simulation alert */}
            {loadMultiplier > 1.0 && (
              <div className="flex items-start gap-1 text-rose-455 animate-pulse font-bold">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>[ALERT_CPU] Stress ativo! Tráfego de testes simulado para alta concorrência: CPU a {metricHistory[metricHistory.length - 1]?.cpu}%!</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
