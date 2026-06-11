import React from "react";
import { Code, Eye, FileText, Check, Plus, Minus } from "lucide-react";

interface DiffViewerProps {
  filename: string;
  diffText: string;
  isLightTheme?: boolean;
}

export default function DiffViewer({
  filename,
  diffText,
  isLightTheme = false
}: DiffViewerProps) {
  // Parse rows of the unified diff
  const parseDiffLines = (text: string) => {
    if (!text) return [{ type: "normal", line: "Nenhuma alteração detectada neste arquivo." }];
    
    return text.split("\n").map((line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        return { type: "addition", line: line.substring(1) };
      }
      if (line.startsWith("-") && !line.startsWith("---")) {
        return { type: "deletion", line: line.substring(1) };
      }
      if (line.startsWith("@@")) {
        return { type: "header", line: line };
      }
      return { type: "normal", line: line };
    });
  };

  const parsedLines = parseDiffLines(diffText);

  return (
    <div className={`rounded-xl border flex flex-col shadow-lg overflow-hidden h-full ${isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
      {/* File Header */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between select-none ${isLightTheme ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-slate-950 border-slate-800 text-slate-300"}`}>
        <div className="flex items-center gap-2 text-xs font-mono">
          <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="font-bold">{filename}</span>
        </div>
        <div className="flex gap-2">
          {/* Legend indicators */}
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 px-1 py-0.5 bg-emerald-950/40 border border-emerald-900/40 rounded">
            <Plus className="h-2.5 w-2.5" /> Adições
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 px-1 py-0.5 bg-rose-950/40 border border-rose-900/40 rounded">
            <Minus className="h-2.5 w-2.5" /> Subtrações
          </span>
        </div>
      </div>

      {/* Code diff list */}
      <div className="flex-1 overflow-auto max-h-[360px] font-mono text-[11px] leading-relaxed select-text bg-[#030612] scrollbar-thin">
        <table className="w-full border-collapse">
          <tbody>
            {parsedLines.map((item, idx) => {
              let rowStyle = "text-slate-400";
              let colStyle = "text-slate-600 border-r border-slate-900/60 text-right pr-2 select-none";
              let opChar = " ";

              if (item.type === "addition") {
                rowStyle = "bg-emerald-950/20 text-emerald-300";
                colStyle = "bg-emerald-950/30 text-emerald-500 border-r border-emerald-900/50 text-right pr-2 select-none";
                opChar = "+";
              } else if (item.type === "deletion") {
                rowStyle = "bg-rose-950/25 text-rose-300 line-through decoration-rose-900/40";
                colStyle = "bg-rose-950/30 text-rose-500 border-r border-rose-900/50 text-right pr-2 select-none";
                opChar = "-";
              } else if (item.type === "header") {
                rowStyle = "bg-indigo-950/25 text-indigo-400 font-bold font-sans italic text-[10px] select-none";
                colStyle = "bg-indigo-950/20 text-indigo-600 border-r border-indigo-900/50 text-right pr-2 select-none";
                opChar = "@";
              }

              return (
                <tr key={idx} className={`${rowStyle} hover:bg-slate-950/40 transition-colors`}>
                  {/* Line Number columns */}
                  <td className={`w-8 ${colStyle}`}>
                    {idx + 1}
                  </td>
                  {/* Operator col */}
                  <td className="w-4 text-center font-bold px-1 select-none text-[10px] opacity-60">
                    {opChar}
                  </td>
                  {/* Actual Code content */}
                  <td className="px-3 whitespace-pre break-all max-w-lg overflow-x-auto select-all">
                    {item.line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
