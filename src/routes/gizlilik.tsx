import { translate as _tx, useLocale as _useLocale } from '@/lib/i18n';
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/gizlilik")({
    head: () => seo("Gizlilik Politikası", "ScadaWatt web sitesi gizlilik politikası."),
    component: () => {
        _useLocale();
        return <LegalPage title={_tx("Gizlilik Politikas\u0131")} sections={["Toplanan veriler", "Verilerin kullanım amaçları", "Verilerin paylaşımı", "Saklama süresi", "Haklarınız", "İletişim"]}/>;
    },
});
