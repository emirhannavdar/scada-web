import { translate as _tx, useLocale as _useLocale } from '@/lib/i18n';
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/kvkk")({
    head: () => seo("KVKK Aydınlatma Metni", "6698 sayılı KVKK kapsamında ScadaWatt aydınlatma metni."),
    component: () => {
        _useLocale();
        return <LegalPage title={_tx("KVKK Ayd\u0131nlatma Metni")} sections={["Veri sorumlusu", "İşlenen kişisel veriler", "İşleme amaçları ve hukuki sebepler", "Aktarım", "İlgili kişinin hakları", "Başvuru yöntemi"]}/>;
    },
});
