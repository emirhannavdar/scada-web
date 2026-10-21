import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Cta } from "@/components/site/Cta";
import { comparison, plans } from "@/content/site";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/paketler")({
    head: () => seo("İzleme Paketleri", "NANO, STANDART ve PRO izleme paketlerini karşılaştırın; santraliniz için en uygun planı seçin ve teklif alın."),
    component: Plans,
});
function Plans() {
    _useLocale();
    return (<>
      <PageHero eyebrow={_tx("Paketler")} title={_tx("Size uygun plan\u0131 se\u00E7in.")} lead={_tx("Mevcut GES izleme \u00FCr\u00FCn\u00FC i\u00E7in NANO, STANDART ve PRO kapsamlar\u0131n\u0131 kar\u015F\u0131la\u015Ft\u0131r\u0131n. Fiyat ve uygulama ko\u015Fullar\u0131 i\u00E7in ekibimizle g\u00F6r\u00FC\u015F\u00FCn.")}/>
      <section data-cms-collection="plans" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {_tx(plans.map((p, i) => (<Reveal key={p.name} delay={i * 0.1}>
                <div data-cms-record={p.id||p.name.toLowerCase()} className={cn("flex h-full flex-col rounded-xl p-8", p.recommended ? "surface-ink shadow-lift" : "border border-border bg-card")}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-4xl font-extrabold">{_tx(p.name)}</h2>
                    {_tx(p.recommended && <span className="rounded-full bg-signal px-3 py-1 text-xs font-semibold text-primary-foreground">{_tx("Tavsiye edilen")}</span>)}
                  </div>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider opacity-70">{_tx(p.term)}</p>
                  <p className="mt-6 text-sm opacity-80">{_tx("Fiyat i\u00E7in teklif al\u0131n")}</p>
                  <ul className="mt-8 flex-1 space-y-3 text-sm">
                    {_tx(p.features.map((f) => (<li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-signal"/> {_tx(f)}</li>)))}
                  </ul>
                  <Cta to="/iletisim" search={{ ilgi: `${p.name} paket`, tur: "teklif" }} variant={p.recommended ? "signal" : "ghost"} className="mt-10 justify-between">{_tx(" Plan\u0131 se\u00E7 ")}</Cta>
                </div>
              </Reveal>)))}
          </div>

          <Reveal className="mt-24">
            <h2 className="text-3xl font-extrabold md:text-4xl">{_tx("Detayl\u0131 kar\u015F\u0131la\u015Ft\u0131rma")}</h2>
            <div className="mt-8 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-paper-2">
                  <tr>
                    <th className="p-4 text-left font-medium text-muted-foreground">{_tx("\u00D6zellik")}</th>
                    {_tx(plans.map((p) => (<th key={p.name} className={cn("p-4 text-center font-display text-lg font-bold", p.recommended && "text-signal")}>{_tx(p.name)}</th>)))}
                  </tr>
                </thead>
                <tbody>
                  {_tx(comparison.map(([f, ...vals],rowIndex) => (<tr key={f} className="border-t border-border transition-colors hover:bg-accent/50">
                      <td data-cms-field={`data.comparison.${rowIndex}.0`} className="p-4">{_tx(f)}</td>
                      {_tx(plans.map((_, i) => (<td data-cms-collection="plans" data-cms-record={plans[i]?.id||plans[i]?.name.toLowerCase()} data-cms-field={`@plans/${plans[i]?.id||plans[i]?.name.toLowerCase()}/comparison/${rowIndex}`} key={i} className={cn("p-4 text-center", i === 1 && "bg-signal-soft/40")}>
                          {_tx(vals[i] === true ? <Check className="mx-auto h-5 w-5 text-signal" aria-label={_tx("Var")}/> : vals[i] === false ? <Minus className="mx-auto h-5 w-5 text-muted-foreground/40" aria-label={_tx("Yok")}/> : vals[i]??'—')}
                        </td>)))}
                    </tr>)))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>
    </>);
}
