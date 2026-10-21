import {OrderedPageSections} from '@/components/site/OrderedPageSections';
import {CmsImage} from '@/components/site/CmsImage';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { products } from "@/content/site";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/urunler/")({
    head: () => seo("Ürünler", "ScadaWatt S3000i veri toplama cihazı, S4000MC çok amaçlı kontrol cihazı ve LOMR-07H şebeke izleme rölesi."),
    component: ProductsPage,
});
function ProductsPage() {
    _useLocale();
    return (<>
      <PageHero eyebrow={_tx("\u00DCr\u00FCnler")} title={_tx("Sahada \u00E7al\u0131\u015Fan donan\u0131m.")} lead={_tx("T\u00FCm ScadaWatt cihazlar\u0131 \u00F6m\u00FCr boyu yaz\u0131l\u0131m g\u00FCncellemesiyle gelir.")}/><OrderedPageSections path="/urunler">
      <section data-cms-collection="products" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
          {_tx(products.map((p, i) => (<Reveal key={p.slug} delay={i * 0.1}>
              <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="h-full">
                <Link data-cms-record={p.slug} to="/urunler/$slug" params={{ slug: p.slug }} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card hover:shadow-lift">
                  <div className="relative bg-paper-2 p-8">
                    <span className="absolute top-5 left-5 font-mono text-xs text-muted-foreground">{_tx(p.code)}</span>
                    <CmsImage src={p.image} alt={_tx(p.name)} className="mx-auto aspect-square w-full max-w-xs object-contain transition-transform duration-700 group-hover:scale-110" loading="lazy"/>
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <p className="font-mono text-xs text-signal">{_tx(p.role)}</p>
                    <h2 className="mt-2 font-display text-3xl font-extrabold">{_tx(p.code)}</h2>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground">{_tx(p.tagline)}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">{_tx(" Detaylar ")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2"/>
                    </span>
                  </div>
                </Link>
              </motion.div>
            </Reveal>)))}
        </div>
      </section>
    </OrderedPageSections></>);
}
