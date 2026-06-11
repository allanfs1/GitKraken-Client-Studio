import React, { useState, useEffect } from "react";
import { ResponsiveGridLayout, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { GripHorizontal } from "lucide-react";

interface Props {
  sidebar: React.ReactNode;
  graph: React.ReactNode;
  properties: React.ReactNode;
  diff: React.ReactNode;
  terminal: React.ReactNode;
  isLightTheme: boolean;
}

const defaultLayouts = {
  lg: [
    { i: "sidebar", x: 0, y: 0, w: 3, h: 25, minW: 2, minH: 15 },
    { i: "graph", x: 3, y: 0, w: 9, h: 11, minW: 5, minH: 6 },
    { i: "properties", x: 3, y: 11, w: 4, h: 8, minW: 3, minH: 5 },
    { i: "diff", x: 7, y: 11, w: 5, h: 8, minW: 4, minH: 5 },
    { i: "terminal", x: 3, y: 19, w: 9, h: 6, minW: 5, minH: 4 }
  ]
};

export default function DraggableDashboard({ sidebar, graph, properties, diff, terminal, isLightTheme }: Props) {
  const [layouts, setLayouts] = useState(defaultLayouts);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("kraken-grid-layout-v6");
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    setWidth(containerRef.current.offsetWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect) {
        setWidth(entries[0].contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const onLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem("kraken-grid-layout-v6", JSON.stringify(allLayouts));
  };

  const bgClass = isLightTheme ? "bg-white border-slate-200" : "bg-[#0f1420] border-slate-800/80";
  const handleBg = isLightTheme ? "bg-slate-100 hover:bg-slate-200 text-slate-400" : "bg-slate-900/50 hover:bg-slate-800 text-slate-500";

  const renderPanel = (key: string, content: React.ReactNode) => (
    <div key={key} className={`flex flex-col border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ${bgClass}`}>
      <div className={`drag-handle cursor-move p-0.5 flex justify-center items-center ${handleBg}`} title="Arraste para reposicionar ou redimensione pelas bordas">
        <GripHorizontal className="h-4 w-4" />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar relative bg-transparent">
        {content}
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="w-full h-full flex-1 relative min-h-[600px]">
        <ResponsiveGridLayout
          width={width > 0 ? width : 1200}
      className="layout -mx-2 mt-2"
      layouts={layouts}
      breakpoints={{ lg: 0 }}
      cols={{ lg: 12 }}
      rowHeight={35}
      onLayoutChange={onLayoutChange}
      margin={[16, 16]}
    >
      {renderPanel("sidebar", sidebar)}
      {renderPanel("graph", graph)}
      {renderPanel("properties", properties)}
      {renderPanel("diff", diff)}
      {renderPanel("terminal", terminal)}
    </ResponsiveGridLayout>
    </div>
  );
}
