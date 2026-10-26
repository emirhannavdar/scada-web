import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
/** Tamamen temsili demo verisi — gerçek santral verisi değildir. */
const plants = [
    { id: "a", name: "Demo GES · Konya", kwp: 1200, eff: 0.82 },
    { id: "b", name: "Demo GES · Ankara", kwp: 640, eff: 0.76 },
    { id: "c", name: "Demo Çatı · Kayseri", kwp: 250, eff: 0.88 },
];
function curve(kwp: number, eff: number) {
    return Array.from({ length: 15 }).map((_, i) => {
        const h = i + 5;
        const sun = Math.max(0, Math.sin(((h - 5.5) / 13.5) * Math.PI));
        return { saat: `${String(h).padStart(2, "0")}:00`, guc: Math.round(kwp * eff * sun * (0.92 + ((h * 7) % 5) / 50)) };
    });
}
const alarmsBy: Record<string, {
    lvl: "warn" | "ok" | "info";
    text: string;
    t: string;
}[]> = {
    a: [
        { lvl: "warn", text: "EV-07 reaktif güç limitine yaklaştı", t: "13:42" },
        { lvl: "ok", text: "Kompanzasyon kademesi devreye alındı", t: "13:43" },
        { lvl: "info", text: "Gün sonu raporu 20:00'de gönderilecek", t: "12:00" },
    ],
    b: [
        { lvl: "warn", text: "EV-03 dize 4 düşük performans", t: "11:15" },
        { lvl: "info", text: "Planlı yük atma talimatı yok", t: "09:00" },
    ],
    c: [{ lvl: "ok", text: "Zero Injection aktif · şebekeye 0 kW", t: "14:05" }],
};
export function DemoDashboard({ className }: {
    className?: string;
}) {
    _useLocale();
    const [id, setId] = useState("a");
    const plant = plants.find((p) => p.id === id)!;
    const data = useMemo(() => curve(plant.kwp, plant.eff), [plant]);
    const now = data[9]?.guc ?? 0;
    const today = Math.round(data.reduce((s, d) => s + d.guc, 0) / 1000 * 10) / 10;
    const invCount = Math.max(4, Math.round(plant.kwp / 100));
    return (<div className={cn("overflow-hidden rounded-xl border border-ink-line bg-ink-2 text-ink-foreground shadow-lift", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal"/>
          <span className="font-display font-bold">{_tx("ScadaWatt")}</span>
          <span className="ml-2 rounded-full bg-grid-soft px-2 py-0.5 font-mono text-[10px] text-grid">{_tx("DEMO VER\u0130")}</span>
        </div>
        <div role="tablist" aria-label={_tx("Santral se\u00E7imi")} className="flex gap-1 rounded-full bg-ink p-1">
          {_tx(plants.map((p) => (<button key={p.id} role="tab" aria-selected={p.id === id} onClick={() => setId(p.id)} className={cn("relative rounded-full px-3 py-1.5 text-xs transition-colors", p.id === id ? "text-primary-foreground" : "text-ink-muted hover:text-ink-foreground")}>
              {_tx(p.id === id && <motion.span layoutId="plant" className="absolute inset-0 rounded-full bg-signal"/>)}
              <span className="relative">{_tx(p.name.replace("Demo ", ""))}</span>
            </button>)))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="grid gap-px bg-ink-line lg:grid-cols-4">
          {_tx([
            ["Anlık güç", `${now.toLocaleString("tr-TR")} kW`],
            ["Kurulu güç", `${plant.kwp.toLocaleString("tr-TR")} kWp`],
            ["Günlük üretim", `${today.toLocaleString("tr-TR")} MWh`],
            ["Evirici", `${invCount} / ${invCount} ${_tx("çevrimiçi")}`],
        ].map(([k, v]) => (<div key={k} className="bg-ink-2 px-5 py-4">
              <p className="eyebrow text-ink-muted">{_tx(k)}</p>
              <p className="mt-1 font-mono text-xl tabular-nums">{_tx(v)}</p>
            </div>)))}
          <div className="bg-ink-2 p-4 lg:col-span-3">
            <p className="eyebrow mb-2 text-ink-muted">{_tx("\u00DCretim e\u011Frisi \u00B7 bug\u00FCn")}</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="var(--signal)" stopOpacity={0.5}/>
                      <stop offset="1" stopColor="var(--signal)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="saat" tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background: "var(--ink)", border: "1px solid var(--ink-line)", borderRadius: 6, fontSize: 12 }} labelStyle={{ color: "var(--ink-muted)" }} formatter={(v: number) => [`${v} kW`, "Güç"]}/>
                  <Area type="monotone" dataKey="guc" stroke="var(--signal)" strokeWidth={2} fill="url(#g)" animationDuration={900}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-ink-2 p-4">
            <p className="eyebrow mb-3 text-ink-muted">{_tx("Olaylar")}</p>
            <ul className="space-y-3">
              {_tx((alarmsBy[id] ?? []).map((a, i) => {
            const Icon = a.lvl === "warn" ? AlertTriangle : a.lvl === "ok" ? CheckCircle2 : Info;
            return (<motion.li key={a.text} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="flex gap-2 text-xs">
                    <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", a.lvl === "warn" ? "text-signal" : a.lvl === "ok" ? "text-grid" : "text-ink-muted")}/>
                    <span>
                      <span className="block">{_tx(a.text)}</span>
                      <span className="font-mono text-ink-muted">{_tx(a.t)}</span>
                    </span>
                  </motion.li>);
        }))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>);
}
