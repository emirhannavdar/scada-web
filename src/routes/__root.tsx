import {ContentStatus} from '@/components/site/ContentStatus';
import {applySeoMetadata} from '@/lib/seo';
import {LaunchEssentials} from '@/components/site/LaunchEssentials';
import { translate as _tx, useLocale as _useLocale } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, Link, createRootRouteWithContext, useRouterState, useNavigate } from '@tanstack/react-router';
import {lazy,Suspense} from 'react';
const PreviewReview=lazy(()=>import("@/components/admin/PreviewReview").then(m=>({default:m.PreviewReview})));
const VisualBridge=lazy(()=>import('@/components/admin/VisualBridge').then(m=>({default:m.VisualBridge})));
import { useEffect } from 'react';
import { ExperienceProvider } from '@/components/site/ExperienceContext';
import { SiteHeader } from '@/components/site/SiteHeader';
import {SiteDesign} from '@/components/site/SiteDesign';
import { SiteFooter } from '@/components/site/SiteFooter';
export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
}>()({ component: RootComponent, errorComponent: () => {
        _useLocale();
        return <div className="not-found sw-wrap"><h1>{_tx("Sayfa y\u00FCklenemedi.")}</h1><p>{_tx("Sayfay\u0131 yenileyebilir veya ana sayfaya d\u00F6nebilirsiniz.")}</p><button type="button" onClick={()=>location.reload()}>{_tx("Yeniden dene")}</button><a href="/">{_tx("Ana sayfaya d\u00F6n\u00FCn \u2192")}</a></div>;
    }, notFoundComponent: () => {
        _useLocale();
        return <div className="launch-404 sw-wrap"><p>404</p><h1>{_tx("Sayfa bulunamadı.")}</h1><p>{_tx("Bu adres değişmiş veya kaldırılmış olabilir. Aşağıdaki bağlantılarla devam edebilirsiniz.")}</p><nav><Link to="/">{_tx("Ana sayfa")}</Link><Link to="/cozumler">{_tx("Çözümler")}</Link><Link to="/iletisim">{_tx("İletişim")}</Link></nav></div>;
    } });
function RootComponent() {
    const language = _useLocale();
    useEffect(() => { document.documentElement.lang = language; }, [language]);
    const { queryClient } = Route.useRouteContext();
    const admin = useRouterState({select:s=>s.location.pathname==='/admin'||s.location.pathname.startsWith('/admin/')});
    const navigate=useNavigate();
    const path=useRouterState({select:s=>s.location.pathname});
    useEffect(()=>{if(document.documentElement.dataset['cmsVisual']!=='true')return;const go=(event:Event)=>{const target=(event as CustomEvent<string>).detail;if(typeof target!=='string')return;const url=new URL(target,location.origin);if(url.origin!==location.origin||url.pathname.startsWith('/admin'))return;void navigate({to:(url.pathname+url.search+url.hash) as '/',resetScroll:true});};window.addEventListener('scadawatt:cms-navigate',go);return()=>window.removeEventListener('scadawatt:cms-navigate',go)},[navigate]);
    useEffect(()=>{if(document.documentElement.dataset['cmsVisual']==='true')requestAnimationFrame(()=>window.dispatchEvent(new Event('scadawatt:cms-route')))},[path]);
    const matches = useRouterState({ select: s => s.matches });
    const statusCode=matches.some(m=>m.status==='notFound')?404:200;
    useEffect(() => {
        const meta = matches.flatMap(m => m.meta ?? []);
        const title = [...meta].reverse().find(m => m && 'title' in m);
        const description = [...meta].reverse().find(m => m && 'name' in m && m.name === 'description');
        applySeoMetadata(
          statusCode===404 ? 'Sayfa bulunamadı. | ScadaWatt' : title && 'title' in title ? String(title.title) : 'ScadaWatt — Yazılım ve Enerji Teknolojileri',
          statusCode===404 ? 'Aradığınız sayfa bulunamadı. ScadaWatt çözümlerini ve donanımlarını keşfedin.' : description && 'content' in description ? String(description.content) : 'ScadaWatt: SCADA yazılımı, veri toplama ve enerji yönetimi teknolojileri.'
        );
    }, [matches, language,statusCode]);
    if(admin)return <QueryClientProvider client={queryClient}><Outlet/></QueryClientProvider>;
    return <QueryClientProvider client={queryClient}><ExperienceProvider><a className="skip-link" href="#main">{_tx("\u0130\u00E7eri\u011Fe ge\u00E7")}</a><SiteHeader /><ContentStatus/>{document.documentElement.dataset['cmsPreview']==='true'&&<div className="cms-preview-banner">{_tx("Taslak önizlemesi · Ziyaretçiler bu değişiklikleri görmez.")} <a href="/admin">{_tx("Yönetime dön")}</a></div>}<main id="main"><Outlet /><LaunchEssentials/></main><SiteFooter /><SiteDesign path={path}/>{document.documentElement.dataset['cmsPreview']==='true'&&<Suspense fallback={null}><PreviewReview/></Suspense>}{document.documentElement.dataset['cmsVisual']==='true'&&<Suspense fallback={null}><VisualBridge/></Suspense>}</ExperienceProvider></QueryClientProvider>;
}
