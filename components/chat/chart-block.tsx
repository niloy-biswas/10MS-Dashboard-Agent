"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import {
  BarChart,
  Bar,
  LabelList,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

function PieLegend({ data, nameKey, valueKey, colors }: { data: Record<string, unknown>[]; nameKey: string; valueKey: string; colors: string[] }) {
  const total = data.reduce((sum, row) => sum + (Number(row[valueKey]) || 0), 0);
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
      {data.map((row, i) => {
        const pct = total > 0 ? ((Number(row[valueKey]) / total) * 100).toFixed(1) : "0";
        return (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-[11px] text-muted-foreground truncate">{String(row[nameKey] ?? "")}</span>
            <span className="text-[11px] text-white/60 font-mono shrink-0">({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
}

export interface ChartSpec {
  type: "bar" | "line" | "area" | "pie";
  title: string;
  description?: string;
  // bar / line / area
  x_key?: string;
  y_keys?: string[];
  // pie
  name_key?: string;
  value_key?: string;
  data: Record<string, unknown>[];
}

const CHART_COLORS = [
  "#4f8ef7", // 10MS blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#e53935", // 10MS red
];

function toLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROTATE_THRESHOLD = 12;

function AngledTick({ x, y, payload }: { x?: string | number; y?: string | number; payload?: { value: string } }) {
  const label = payload?.value ?? "";
  const shouldRotate = label.length > ROTATE_THRESHOLD;
  const truncated = label.length > 18 ? label.slice(0, 18) + "…" : label;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={shouldRotate ? 4 : 10}
        textAnchor={shouldRotate ? "end" : "middle"}
        fill="rgba(255,255,255,0.45)"
        fontSize={10}
        transform={shouldRotate ? "rotate(-40)" : undefined}
      >
        {truncated}
      </text>
    </g>
  );
}

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function xAxisMargin(data: Record<string, unknown>[], xKey: string | undefined): number {
  if (!xKey) return 8;
  return data.some((r) => String(r[xKey] ?? "").length > ROTATE_THRESHOLD) ? 60 : 8;
}

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  const config: ChartConfig = {};

  if (spec.type === "pie" && spec.value_key) {
    config[spec.value_key] = {
      label: toLabel(spec.value_key),
      color: CHART_COLORS[0],
    };
  } else if (spec.y_keys) {
    spec.y_keys.forEach((key, i) => {
      config[key] = {
        label: toLabel(key),
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
  }

  const hasMultipleSeries = (spec.y_keys?.length ?? 0) > 1;
  const chartRef = useRef<HTMLDivElement>(null);

  // Validate required fields based on chart type
  const isInvalid =
    spec.type !== "pie" && (!spec.x_key || !spec.y_keys?.length);
  const isPieInvalid =
    spec.type === "pie" && (!spec.value_key || !spec.name_key);

  if (isInvalid || isPieInvalid) {
    return (
      <div className="mt-3 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-xs text-muted-foreground">
        Chart could not be rendered: missing required fields ({spec.type === "pie" ? "name_key / value_key" : "x_key / y_keys"}).
      </div>
    );
  }

  async function handleDownload() {
    if (!chartRef.current) return;

    const svgEl = chartRef.current.querySelector(".recharts-wrapper svg");
    if (!svgEl) return;

    const padding = 24;

    // Read actual rendered dimensions from the recharts container div
    const rechartWrapper = chartRef.current.querySelector(".recharts-wrapper") as HTMLElement | null;
    const svgWidth = rechartWrapper ? rechartWrapper.offsetWidth : chartRef.current.offsetWidth - padding * 2;
    const svgHeight = rechartWrapper ? rechartWrapper.offsetHeight : 240;

    // Clone and stamp explicit dimensions so the browser renders it correctly
    const svgClone = svgEl.cloneNode(true) as SVGElement;
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("width", String(svgWidth));
    svgClone.setAttribute("height", String(svgHeight));

    // Resolve all CSS variables — scoped chart color vars live on the [data-chart] element
    const chartContainer = chartRef.current.querySelector("[data-chart]") as HTMLElement | null;
    const scopedStyles = chartContainer ? getComputedStyle(chartContainer) : getComputedStyle(document.documentElement);
    const rootStyles = getComputedStyle(document.documentElement);

    const resolveVar = (varName: string): string =>
      scopedStyles.getPropertyValue(varName).trim() ||
      rootStyles.getPropertyValue(varName).trim();

    // Also resolve colors from the original live SVG elements (most reliable source)
    const liveSvgEls = Array.from(svgEl.querySelectorAll<SVGElement>("*"));
    const clonedEls = Array.from(svgClone.querySelectorAll<SVGElement>("*"));

    clonedEls.forEach((clonedEl, i) => {
      const liveEl = liveSvgEls[i];
      if (!liveEl) return;
      const liveStyle = getComputedStyle(liveEl);

      (["fill", "stroke"] as const).forEach((attr) => {
        const attrVal = clonedEl.getAttribute(attr);
        if (attrVal && attrVal.includes("var(")) {
          const varName = attrVal.match(/var\((--[\w-]+)\)/)?.[1];
          if (varName) {
            const resolved = resolveVar(varName);
            if (resolved) clonedEl.setAttribute(attr, resolved);
          }
        }
        // Also inline the computed style value directly from the live element
        const computed = liveStyle[attr];
        if (computed && computed !== "none" && computed !== "" && !computed.includes("var(")) {
          clonedEl.setAttribute(attr, computed);
        }
      });
    });

    const titleLineHeight = 20;
    const headerHeight = padding + titleLineHeight + (spec.description ? 20 : 0) + 12;
    const totalWidth = svgWidth + padding * 2;

    const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Build pie legend SVG if applicable
    let legendSvg = "";
    let legendHeight = 0;
    if (spec.type === "pie" && spec.name_key && spec.value_key) {
      const total = spec.data.reduce((sum, r) => sum + (Number(r[spec.value_key!]) || 0), 0);
      const itemHeight = 20;
      const colWidth = (totalWidth - padding * 2) / 2;
      const rows: string[] = [];
      spec.data.forEach((row, i) => {
        const col = i % 2;
        const rowIdx = Math.floor(i / 2);
        const x = padding + col * colWidth;
        const y = rowIdx * itemHeight + 8;
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const pct = total > 0 ? ((Number(row[spec.value_key!]) / total) * 100).toFixed(1) : "0";
        const name = String(row[spec.name_key!] ?? "");
        const truncated = name.length > 30 ? name.slice(0, 30) + "…" : name;
        rows.push(`<rect x="${x}" y="${y - 9}" width="9" height="9" rx="2" fill="${color}"/>`);
        rows.push(`<text x="${x + 13}" y="${y}" font-family="Inter,sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">${escapeXml(truncated)} <tspan font-weight="600" fill="rgba(255,255,255,0.75)">(${pct}%)</tspan></text>`);
      });
      const numRows = Math.ceil(spec.data.length / 2);
      legendHeight = numRows * itemHeight + 16;
      legendSvg = `<g transform="translate(0,${headerHeight + svgHeight + 8})">${rows.join("")}</g>`;
    }

    const totalHeight = svgHeight + headerHeight + legendHeight + padding;

    const wrapperSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="#0e1117" rx="12"/>
  <text x="${padding}" y="${padding + 14}" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#ffffff">${escapeXml(spec.title)}</text>
  ${spec.description ? `<text x="${padding}" y="${padding + titleLineHeight + 14}" font-family="Inter,sans-serif" font-size="11" fill="#6b7a96">${escapeXml(spec.description)}</text>` : ""}
  <g transform="translate(${padding},${headerHeight})">${svgClone.outerHTML}</g>
  ${legendSvg}
</svg>`;

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Chart export failed: canvas 2d context unavailable.");
      return;
    }
    ctx.scale(scale, scale);

    const blob = new Blob([wrapperSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `${spec.title.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.error("Chart export failed: SVG could not be rendered to canvas.");
    };
    img.src = url;
  }

  return (
    <div ref={chartRef} className="mt-3 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{spec.title}</p>
          {spec.description && (
            <p className="text-xs text-muted-foreground mt-0.5 mb-1">{spec.description}</p>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.07] transition-colors shrink-0"
          title="Download chart"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      <ChartContainer config={config} className={`mt-4 w-full ${spec.type === "pie" ? "h-72" : "h-60"}`}>
        {spec.type === "pie" && spec.value_key && spec.name_key ? (
          <PieChart>
            <Pie
              data={spec.data.map((row, i) => ({ ...row, fill: CHART_COLORS[i % CHART_COLORS.length] }))}
              dataKey={spec.value_key}
              nameKey={spec.name_key}
              cx="50%"
              cy="50%"
              outerRadius={95}
              label={({ cx, cy, midAngle, outerRadius, percent }) => {
                if (!percent || !midAngle || percent < 0.04) return null;
                const RADIAN = Math.PI / 180;
                const x = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
                const y = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={600}
                    fill="rgba(255,255,255,0.75)"
                  >
                    {`${(percent * 100).toFixed(1)}%`}
                  </text>
                );
              }}
              labelLine={(props) => {
                const p = props as { percent?: number; cx?: number; cy?: number; midAngle?: number; outerRadius?: number; stroke?: string };
                if (!p.percent || p.percent < 0.04) return <></>;
                if (p.cx == null || p.cy == null || p.midAngle == null || p.outerRadius == null) return <></>;
                const RADIAN = Math.PI / 180;
                const x1 = p.cx + p.outerRadius * Math.cos(-p.midAngle * RADIAN);
                const y1 = p.cy + p.outerRadius * Math.sin(-p.midAngle * RADIAN);
                const x2 = p.cx + (p.outerRadius + 15) * Math.cos(-p.midAngle * RADIAN);
                const y2 = p.cy + (p.outerRadius + 15) * Math.sin(-p.midAngle * RADIAN);
                return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.stroke ?? "rgba(255,255,255,0.2)"} strokeWidth={1} />;
              }}
            />
            <ChartTooltip content={<ChartTooltipContent nameKey={spec.name_key} />} />
          </PieChart>
        ) : spec.type === "pie" ? null
        : spec.type === "line" ? (
          <LineChart data={spec.data} margin={{ bottom: xAxisMargin(spec.data, spec.x_key) }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey={spec.x_key}
              tick={AngledTick}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {hasMultipleSeries && <ChartLegend content={<ChartLegendContent />} />}
            {(spec.y_keys ?? []).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        ) : spec.type === "area" ? (
          <AreaChart data={spec.data} margin={{ bottom: xAxisMargin(spec.data, spec.x_key) }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey={spec.x_key}
              tick={AngledTick}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {hasMultipleSeries && <ChartLegend content={<ChartLegendContent />} />}
            {(spec.y_keys ?? []).map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart data={spec.data} margin={{ bottom: xAxisMargin(spec.data, spec.x_key) }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey={spec.x_key}
              tick={AngledTick}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {hasMultipleSeries && <ChartLegend content={<ChartLegendContent />} />}
            {(spec.y_keys ?? []).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey={key}
                  position="top"
                  style={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }}
                  formatter={(v: unknown) => formatYAxis(Number(v))}
                />
              </Bar>
            ))}
          </BarChart>
        )}
      </ChartContainer>
      {spec.type === "pie" && spec.name_key && (
        <PieLegend data={spec.data} nameKey={spec.name_key} valueKey={spec.value_key!} colors={CHART_COLORS} />
      )}
    </div>
  );
}
