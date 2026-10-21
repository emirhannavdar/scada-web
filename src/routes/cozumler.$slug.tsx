import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Cta } from "@/components/site/Cta";
import { solutions } from "@/content/site";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/cozumler/$slug")({
    loader: ({ params }) => {
        const s = solutions.find((x) => x.slug === params.slug);
        if (!s)
            throw notFound();
        return s;
    },
    head: ({ loaderData }) => loaderData ? seo(loaderData.title, loaderData.short) : { meta: [{ title: "Çözüm bulunamadı | ScadaWatt" }, { name: "robots", content: "noindex" }] },
    component: SolutionPage,
});
function SolutionPage() {
    _useLocale();
    const loaded = Route.useLoaderData(),s=solutions.find(item=>item.slug===loaded.slug);
    if(!s)return <div className="sw-wrap py-24"><h1>{_tx('Sayfa bulunamadı.')}</h1><Link to="/cozumler">{_tx('Çözümler')}</Link></div>;
    const idx = solutions.findIndex((x) => x.slug === s.slug);
    const next = solutions[(idx + 1) % solutions.length]!;
    return (<div data-cms-collection="solutions" data-cms-record={s.slug}>
      <PageHero eyebrow={_tx("\u00C7\u00F6z\u00FCm")} title={_tx(s.title)} lead={_tx(s.short)}/>
      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground lg:col-span-7">
            {_tx(s.body.map((b) => (<Reveal key={b}><p>{_tx(b)}</p></Reveal>)))}
            <div className="pt-6">
              <Cta to="/iletisim" search={{ ilgi: s.title, tur: "demo" }}>{_tx("Bu \u00E7\u00F6z\u00FCm i\u00E7in demo talep et")}</Cta>
            </div>
          </div>
          <Reveal className="lg:col-span-5" delay={0.15}>
            <div className="surface-ink rounded-xl p-8">
              <p className="eyebrow text-signal">{_tx("Kapsam")}</p>
              <ul className="mt-6 space-y-4">
                {_tx(s.points.map((p) => (<li key={p} className="flex items-center gap-3 border-b border-ink-line pb-4 last:border-0">
                    <Check className="h-5 w-5 text-signal"/> {_tx(p)}
                  </li>)))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
      <Link to="/cozumler/$slug" params={{ slug: next.slug }} className="group block border-t border-border bg-paper-2 py-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div>
            <p className="eyebrow text-muted-foreground">{_tx("Sonraki \u00E7\u00F6z\u00FCm")}</p>
            <p className="mt-2 font-display text-3xl font-bold md:text-5xl">{_tx(next.title)}</p>
          </div>
          <ArrowRight className="h-10 w-10 transition-transform group-hover:translate-x-3"/>
        </div>
      </Link>
    </div>);
}
