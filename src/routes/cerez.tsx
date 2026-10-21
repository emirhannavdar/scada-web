import { translate as _tx, useLocale as _useLocale } from '@/lib/i18n';
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/cerez")({
    head: () => seo("Çerez Politikası", "ScadaWatt web sitesi çerez politikası."),
    component: () => {
        _useLocale();
        return <LegalPage title={_tx("\u00C7erez Politikas\u0131")} sections={["Çerez nedir", "Kullanılan çerez türleri", "Çerezlerin yönetimi", "Değişiklikler"]}/>;
    },
});
