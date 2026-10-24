import {OrderedPageSections} from '@/components/site/OrderedPageSections';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { solutions } from "@/content/site";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/cozumler/")({
    head: () => seo("SCADA ve Enerji Yönetimi Çözümleri", "GES uzaktan izleme, limit yönetimi, kompanzasyon, zero injection, planlı yük atma, saatlik mahsuplaşma takibi ve anlık bildirim çözümleri."),
    component: Solutions,
});
function Solutions() {
    _useLocale();
    return (<>
      <PageHero eyebrow={_tx("\u00C7\u00F6z\u00FCmler")} title={_tx("Enerji ve veri i\u00E7in \u00E7\u00F6z\u00FCmler.")} lead={_tx("Enerji y\u00F6netimi, uzaktan izleme, \u00FCretim analizi ve saha kontrol\u00FC i\u00E7in ScadaWatt \u00E7\u00F6z\u00FCmlerini ke\u015Ffedin.")}/><OrderedPageSections path="/cozumler">
      <section data-cms-collection="solutions" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          {_tx(solutions.map((s, i) => (<Reveal key={s.slug}>
              <Link data-cms-record={s.slug} to="/cozumler/$slug" params={{ slug: s.slug }} className="group grid items-center gap-6 border-b border-border py-10 md:grid-cols-12">
                <span className="font-mono text-sm text-signal md:col-span-1">{_tx("0")}{_tx(i + 1)}</span>
                <h2 className="font-display text-3xl font-bold transition-transform duration-500 group-hover:translate-x-3 md:col-span-5 md:text-3xl">{_tx(s.title)}</h2>
                <p className="text-muted-foreground md:col-span-5">{_tx(s.short)}</p>
                <span className="grid h-14 w-14 place-items-center justify-self-end rounded-full border border-border transition-all duration-500 group-hover:rotate-45 group-hover:border-signal group-hover:bg-signal group-hover:text-primary-foreground md:col-span-1">
                  <ArrowUpRight className="h-5 w-5"/>
                </span>
              </Link>
            </Reveal>)))}
        </div>
      </section>
    </OrderedPageSections></>);
}
