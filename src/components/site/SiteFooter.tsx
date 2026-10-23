import {CmsImage} from '@/components/site/CmsImage';
import {translate as t,useLocale} from '@/lib/i18n';
import {cmsAsset} from '@/lib/cms-state';
import type {CSSProperties} from 'react';
import {Link} from '@tanstack/react-router';
import {contact,images,products} from '@/content/site';
export function SiteFooter(){
 useLocale();
 const brandStyle={'--brand-mask':`url(${JSON.stringify(cmsAsset(images.wordmark))})`} as CSSProperties;
 return <footer className="corporate-footer site-footer" data-site-footer="true" aria-label={t('ScadaWatt site bilgileri')}>
 <div className="sw-wrap">
 <div className="footer-layout">
 <div><Link className="footer-logo-link" to="/" aria-label={t('ScadaWatt ana sayfa')}>
 <span className="footer-wordmark" style={brandStyle}><CmsImage className="footer-logo" src={images.wordmark} alt="ScadaWatt" width="170" height="49"/></span>
 </Link><p className="footer-about">{t('Yazılım, elektronik ve AR-GE.')}<br/>{t('Sahadaki veri ile enerji yönetimi')}<br/>{t('arasında bağlantı kuruyoruz.')}</p></div>
 <nav aria-label={t('Teknoloji bağlantıları')}><p className="footer-column-title">{t('Teknoloji')}</p><Link to="/scada-yazilimi">{t('SCADA yazılımı')}</Link><Link to="/scada-yazilimi" hash="uygulamalar">{t('Web & mobil uygulamalar')}</Link><Link to="/cozumler">{t('Çözümler')}</Link><Link to="/paketler">{t('İzleme planları')}</Link></nav>
 <nav aria-label={t('Donanım bağlantıları')}><p className="footer-column-title">{t('Donanımlar')}</p>{products.map(p=><Link key={p.slug} to="/urunler/$slug" params={{slug:p.slug}}>{t(p.code)}</Link>)}<Link to="/hakkimizda">{t('Hakkımızda')}</Link></nav>
 <div><p className="footer-column-title">{t('ScadaWatt / Ankara')}</p><address>{t(contact.address)}</address><a href={contact.phoneHref}>{t(contact.phone)}</a><a href={`mailto:${contact.email}`}>{t(contact.email)}</a><Link to="/iletisim">{t('İletişim')} →</Link></div>
 </div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()}{' '}ScadaWatt</span><nav aria-label={t('Yasal bilgiler')}><Link to="/kullanim-kosullari">{t('Kullanım koşulları')}</Link><Link to="/privacy-policy">{t('Gizlilik Politikası')}</Link><Link to="/cerez">{t('Çerez Politikası')}</Link><a href="/model-credits.html">{t('3B kaynakları')}</a></nav></div>
 </div></footer>;
}
