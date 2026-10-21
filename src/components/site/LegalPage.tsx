import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { PageHero, Draft } from "./PageHero";
export function LegalPage({ title, sections }: {
    title: string;
    sections: string[];
}) {
    _useLocale();
    return (<>
      <PageHero eyebrow={_tx("Yasal")} title={_tx(title)}/>
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-lg border border-signal/40 bg-signal-soft p-5 text-sm">
            <Draft>{_tx("Hukuki onay gerekli")}</Draft>
            <p className="mt-3">{_tx("Bu sayfan\u0131n metni ScadaWatt hukuk dan\u0131\u015Fman\u0131 taraf\u0131ndan haz\u0131rlan\u0131p onaylanmal\u0131d\u0131r. A\u015Fa\u011F\u0131daki ba\u015Fl\u0131klar yaln\u0131zca yap\u0131 \u00F6nerisidir.")}</p>
          </div>
          <ol className="mt-12 space-y-8">
            {_tx(sections.map((s, i) => (<li key={s}>
                <h2 className="text-xl font-bold">{_tx(i + 1)}{_tx(". ")}{_tx(s)}</h2>
                <p className="mt-2 text-muted-foreground">{_tx("[Onayl\u0131 metin eklenecek]")}</p>
              </li>)))}
          </ol>
        </div>
      </section>
    </>);
}
