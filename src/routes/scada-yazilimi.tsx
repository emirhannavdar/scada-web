import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { ApplicationGallery } from '@/components/site/ApplicationGallery';
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Gauge, LineChart, Receipt, ShieldCheck, Waves } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { DemoDashboard } from "@/components/site/DemoDashboard";
import { Reveal, SplitHeading } from "@/components/site/Reveal";
import { Cta } from "@/components/site/Cta";
import { images } from "@/content/site";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/scada-yazilimi")({
    head: () => seo("SCADA Yazılımı", "ScadaWatt SCADA platformu: çok noktadan üretim verisi, limit ve kompanzasyon kontrolü, fatura doğrulama, PTF takibi ve anlık bildirimler."),
    component: Scada,
});
const caps = [
    { icon: LineChart, t: "Çok noktadan üretim verisi", d: "Evirici, analizör ve sayaç verileri eş zamanlı karşılaştırılır; en doğru üretim raporu oluşur." },
    { icon: Gauge, t: "Limit yönetimi", d: "Evirici ve saha limitleri anlık takip edilir, ceza riskleri önlenir." },
    { icon: Waves, t: "Kompanzasyon kontrolü", d: "Reaktif güç sürekli izlenir; limit aşımında kompanzasyon kontrol edilir." },
    { icon: Receipt, t: "Fatura doğrulama", d: "Saatlik veriler üzerinden fatura doğrulaması yapılır." },
    { icon: ShieldCheck, t: "PTF ve piyasa kontrolü", d: "Piyasa fiyatları ve PTF kontrolleriyle santral optimum seviyede yönetilir." },
    { icon: Bell, t: "Anlık bildirimler", d: "SMS, e-posta, iOS ve Android üzerinden alarm ve gün sonu raporları." },
];
function Scada() {
    _useLocale();
    return (<>
      <PageHero eyebrow={_tx("SCADA Yaz\u0131l\u0131m\u0131")} title={_tx("ScadaWatt SCADA yaz\u0131l\u0131m\u0131.")} lead={_tx("\u00D6l\u00E7\u00FCm, izleme, analiz ve enerji y\u00F6netimi i\u00E7in geli\u015Ftirilen yaz\u0131l\u0131m yakla\u015F\u0131m\u0131n\u0131 ke\u015Ffedin.")}/>
      <ApplicationGallery />
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <SplitHeading text="Yazılımın yapabildikleri" className="text-4xl font-extrabold md:text-6xl"/>
          <div className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {_tx(caps.map((c, i) => (<Reveal key={c.t} delay={(i % 3) * 0.08}>
                <c.icon className="h-8 w-8 text-signal" strokeWidth={1.5}/>
                <h3 className="mt-5 text-2xl font-bold">{_tx(c.t)}</h3>
                <p className="mt-2 text-muted-foreground">{_tx(c.d)}</p>
              </Reveal>)))}
          </div>
        </div>
      </section>
      <section className="surface-ink py-16"><div className="sw-wrap"><h2 className="text-3xl font-medium">{_tx("\u0130zleme aray\u00FCz\u00FC yakla\u015F\u0131m\u0131")}</h2><p className="mt-4 mb-8 text-sm text-ink-muted">{_tx("A\u015Fa\u011F\u0131daki \u00F6rnek aray\u00FCz temsili verilerle \u00E7al\u0131\u015F\u0131r. Ger\u00E7ek uygulama ekran\u0131 veya canl\u0131 veri de\u011Fildir.")}</p><DemoDashboard /></div></section>
    </>);
}
