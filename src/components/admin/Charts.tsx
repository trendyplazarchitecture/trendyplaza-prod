"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { isRtl } from "@/lib/i18n-content";
import { Empty } from "./AdminChrome";

/**
 * Charts drawn the way a drawing is drawn: thin strokes, a real grid, figures
 * you can read off an axis. No gradients under the curve, no rounded bar caps,
 * no drop shadows. The data is the ink.
 *
 * Every chart here is small-multiple sized. A dashboard whose first element is
 * one enormous line chart has decided that trend matters more than the twelve
 * orders waiting for a phone call, which is the wrong priority for this team.
 */

const INK = "oklch(0.176 0.003 285)";
const MUTED = "oklch(0.518 0.007 285)";
const RULE = "oklch(0.92 0.004 286)";
const RED = "oklch(0.588 0.226 27.5)";
const GREEN = "oklch(0.56 0.12 155)";

const AXIS = {
  stroke: MUTED,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded border border-rule bg-card px-2.5 py-2 text-xs shadow-sm">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-foreground">{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-[1px]"
            style={{ background: entry.color }}
          />
          <span>{entry.name}</span>
          <span className="figures ms-auto font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Short weekday and day number. A 14-day axis of ISO dates is unreadable. */
function shortDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()}`;
}

export function OrderTrendChart({
  data,
}: {
  data: { day: string; placed: number; delivered: number }[];
}) {
  const t = useTranslations("admin.charts");
  const shouldReduceMotion = useReducedMotion();
  const total = data.reduce((sum, d) => sum + d.placed, 0);

  if (total === 0) {
    return <Empty title={t("noOrdersTitle")} hint={t("noOrdersHint")} />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="day" tickFormatter={shortDay} {...AXIS} minTickGap={12} />
        <YAxis allowDecimals={false} width={38} {...AXIS} />
        <Tooltip content={<TooltipBox />} cursor={{ stroke: RULE }} />
        {/* A very light wash under the line, not a gradient. It reads as
            hatching on a section drawing. */}
        <Area
          type="monotone"
          dataKey="placed"
          name={t("placed")}
          stroke={INK}
          strokeWidth={1.5}
          fill={INK}
          fillOpacity={0.05}
          isAnimationActive={!shouldReduceMotion}
          animationDuration={600}
        />
        <Area
          type="monotone"
          dataKey="delivered"
          name={t("delivered")}
          stroke={GREEN}
          strokeWidth={1.5}
          fill={GREEN}
          fillOpacity={0.05}
          isAnimationActive={!shouldReduceMotion}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WilayaChart({ data }: { data: { name: string; n: number }[] }) {
  const t = useTranslations("admin.charts");
  const rtl = isRtl(useLocale());
  const shouldReduceMotion = useReducedMotion();

  if (data.length === 0) {
    return <Empty title={t("noDeliveriesTitle")} hint={t("noDeliveriesHint")} />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={
          rtl ? { top: 0, right: 0, bottom: 0, left: 12 } : { top: 0, right: 12, bottom: 0, left: 0 }
        }
      >
        <CartesianGrid stroke={RULE} strokeDasharray="2 4" horizontal={false} />
        {/*
          Recharts doesn't read CSS `dir`, so a horizontal bar chart stays
          left-anchored under RTL unless told otherwise: the category axis
          moves to the right (where an Arabic reader starts) and the numeric
          axis reverses so bars grow toward the left, same reading order as
          the rest of the page.
        */}
        <XAxis type="number" allowDecimals={false} reversed={rtl} {...AXIS} />
        <YAxis type="category" dataKey="name" width={96} orientation={rtl ? "right" : "left"} {...AXIS} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "oklch(0.964 0.002 286)" }} />
        <Bar
          dataKey="n"
          name={t("orders")}
          fill={RED}
          radius={rtl ? [2, 0, 0, 2] : [0, 2, 2, 0]}
          barSize={12}
          isAnimationActive={!shouldReduceMotion}
          animationDuration={500}
        >
          {data.map((_, i) => (
            // The busiest wilaya at full strength, the rest stepping back, so
            // the ranking is visible without reading the axis.
            <Cell key={i} fillOpacity={1 - i * 0.13} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * How the LMS is being entered. Two numbers and a proportion, drawn as one
 * divided bar: a pie chart of two slices asks the reader to compare angles
 * when they only need to compare lengths.
 */
export function AccessMixBar({
  code,
  request,
  admin,
}: {
  code: number;
  request: number;
  admin: number;
}) {
  const t = useTranslations("admin.charts");
  const total = code + request + admin;

  if (total === 0) {
    return <Empty title={t("nobodyEnteredTitle")} hint={t("nobodyEnteredHint")} />;
  }

  const segments = [
    { label: t("printedCard"), value: code, className: "bg-primary" },
    { label: t("receiptApproved"), value: request, className: "bg-sky-500" },
    { label: t("grantedByAdmin"), value: admin, className: "bg-zinc-400" },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-sm"
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.className} transition-[flex-grow] duration-500`}
            style={{ flexGrow: s.value }}
          />
        ))}
      </div>
      <dl className="mt-3.5 space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className={`h-2 w-2 rounded-[1px] ${s.className}`} />
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className="figures ms-auto font-semibold">
              {s.value}
              <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                {Math.round((s.value / total) * 100)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
