import React from "react";
import { Commit } from "../types";
import { GitCommit, GitPullRequest, Bookmark, User, Calendar } from "lucide-react";

interface GitGraphProps {
  commits: Commit[];
  activeBranch: string;
  selectedCommitSha: string | null;
  onSelectCommit: (commit: Commit) => void;
  isLightTheme?: boolean;
}

// Map branches to distinct colors
export const getBranchColorClass = (branch: string): { stroke: string; bg: string; border: string; text: string } => {
  const bOr = branch.toLowerCase();
  if (bOr.includes("main") || bOr.includes("master")) {
    return {
      stroke: "#06b6d4", // cyan-500
      bg: "bg-cyan-500/20",
      border: "border-cyan-500",
      text: "text-cyan-400"
    };
  }
  if (bOr.includes("payment") || bOr.includes("feature-ui")) {
    return {
      stroke: "#a855f7", // purple-500
      bg: "bg-purple-500/20",
      border: "border-purple-500",
      text: "text-purple-400"
    };
  }
  if (bOr.includes("auth") || bOr.includes("bugfix")) {
    return {
      stroke: "#f97316", // orange-500
      bg: "bg-orange-500/20",
      border: "border-orange-500",
      text: "text-orange-400"
    };
  }
  return {
    stroke: "#eab308", // yellow-500
    bg: "bg-yellow-500/20",
    border: "border-yellow-500",
    text: "text-yellow-400"
  };
};

export default function GitGraph({
  commits,
  activeBranch,
  selectedCommitSha,
  onSelectCommit,
  isLightTheme = false
}: GitGraphProps) {
  // Let's compute a set column index for each branch present in history
  const branches = Array.from(new Set(commits.map((c) => c.branch)));
  const getBranchColIndex = (branchName: string) => {
    // We want main to be always leftmost
    if (branchName === "main" || branchName === "master") return 0;
    const index = branches.filter(b => b !== "main" && b !== "master").indexOf(branchName);
    return index !== -1 ? index + 1 : 1;
  };

  const rowHeight = 44;
  const colWidth = 28;
  const paddingLeft = 30;

  // Render SVG connections
  const renderConnections = () => {
    const paths: React.ReactNode[] = [];

    commits.forEach((commit, index) => {
      const col = getBranchColIndex(commit.branch);
      const x1 = paddingLeft + col * colWidth;
      const y1 = index * rowHeight + rowHeight / 2;

      commit.parents.forEach((parentSha) => {
        const parentIndex = commits.findIndex((c) => c.sha === parentSha);
        if (parentIndex !== -1) {
          const parentCommit = commits[parentIndex];
          const parentCol = getBranchColIndex(parentCommit.branch);
          const x2 = paddingLeft + parentCol * colWidth;
          const y2 = parentIndex * rowHeight + rowHeight / 2;

          // Curve logic: smooth S-curves (Sygmoid-style transitions)
          // Since commits are aligned vertically, we curve gracefully
          const color = getBranchColorClass(commit.branch).stroke;

          const pathD = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;

          paths.push(
            <path
              key={`${commit.sha}-${parentSha}`}
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeDasharray={commit.branch !== parentCommit.branch ? "4 2" : "none"}
              className="opacity-80 transition-all duration-300"
            />
          );
        }
      });
    });

    return paths;
  };

  return (
    <div className={`overflow-hidden rounded-xl border ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"} shadow-inner flex flex-col`}>
      {/* Table Header */}
      <div className={`flex items-center text-[10px] uppercase font-mono tracking-widest px-4 py-2 border-b font-semibold select-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
        <div style={{ width: paddingLeft + branches.length * colWidth }} className="text-center">Gráfico</div>
        <div className="flex-1 px-4 text-left">Mensagem de Commit</div>
        <div className="w-24 text-center hidden md:block">Autor</div>
        <div className="w-20 text-center">Data</div>
        <div className="w-20 text-center font-mono">SHA</div>
      </div>

      {/* Rows & SVG canvas container */}
      <div className="relative flex-1 max-h-[480px] overflow-y-auto overflow-x-hidden">
        {/* SVG absolute overlay container */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: paddingLeft + branches.length * colWidth,
            height: commits.length * rowHeight,
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          {renderConnections()}

          {/* Render individual node dots on top of the paths */}
          {commits.map((commit, index) => {
            const col = getBranchColIndex(commit.branch);
            const x = paddingLeft + col * colWidth;
            const y = index * rowHeight + rowHeight / 2;
            const isSelected = selectedCommitSha === commit.sha;
            const config = getBranchColorClass(commit.branch);

            return (
              <g key={`node-${commit.sha}`}>
                {/* Active selection ripple ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="none"
                    stroke={config.stroke}
                    strokeWidth="2"
                    className="animate-ping opacity-65"
                  />
                )}
                {/* Outermost border dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="6.5"
                  className="transition-all duration-200"
                  fill={isLightTheme ? "#ffffff" : "#0f172a"}
                  stroke={config.stroke}
                  strokeWidth="3.5"
                />
                {/* Center active dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill={config.stroke}
                />
              </g>
            );
          })}
        </svg>

        {/* Vertical commit logs list matching SVG positions */}
        <div className="relative z-0 select-none">
          {commits.map((commit, index) => {
            const isSelected = selectedCommitSha === commit.sha;
            const tagColor = getBranchColorClass(commit.branch);

            return (
              <div
                key={commit.sha}
                id={`commit-${commit.sha}`}
                onClick={() => onSelectCommit(commit)}
                style={{ height: rowHeight }}
                className={`flex items-center px-4 cursor-pointer text-xs transition border-b leading-none ${
                    isSelected
                      ? isLightTheme
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-indigo-950/40 border-indigo-900/60 text-slate-100"
                      : isLightTheme
                      ? "hover:bg-slate-50 border-slate-100 text-slate-700"
                      : "hover:bg-slate-950 border-slate-800/50 text-slate-350"
                  }`}
              >
                {/* Graph Spacer */}
                <div style={{ width: paddingLeft + branches.length * colWidth, flexShrink: 0 }} />

                {/* Commit Message & Labels */}
                <div className="flex-grow flex items-center min-w-0 px-4 gap-2">
                  <span className={`truncate font-sans font-medium text-[13px] ${
                    isLightTheme ? "text-slate-800" : "text-slate-200"
                  }`}>
                    <span className={isSelected ? "font-bold text-indigo-500" : ""}>{commit.message}</span>
                  </span>

                  {/* Branch Pill Tag */}
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 items-center gap-0.5 flex ${tagColor.bg} ${tagColor.border} ${tagColor.text}`}
                  >
                    <Bookmark className="h-2 w-2" />
                    {commit.branch}
                  </span>

                  {/* Unpushed/Local label */}
                  {commit.pushed === false && (
                    <span className="text-[9px] font-mono font-bold bg-amber-950/40 border border-amber-900/60 text-amber-400 px-1.5 py-0.5 rounded-full uppercase shrink-0 flex items-center gap-1 animate-pulse">
                      <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                      local
                    </span>
                  )}

                  {/* Merge label */}
                  {commit.isMerge && (
                    <span className="text-[9px] font-mono font-bold bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                      Merge
                    </span>
                  )}
                </div>

                {/* Author Info */}
                <div className="w-24 shrink-0 text-center hidden md:flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
                  {commit.avatarUrl ? (
                    <img
                      src={commit.avatarUrl}
                      alt={commit.author}
                      className="h-4 w-4 rounded-full border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span className="truncate max-w-[70px]">{commit.author}</span>
                </div>

                {/* Date */}
                <div className="w-20 shrink-0 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 font-sans">
                  <span>{commit.date}</span>
                </div>

                {/* SHA hash */}
                <div className="w-20 shrink-0 text-center text-[10px] font-mono font-semibold text-indigo-400/80">
                  {commit.sha}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
