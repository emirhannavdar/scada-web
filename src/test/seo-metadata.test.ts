import {afterEach,expect,it} from 'vitest';
import {applySeoMetadata,localizedSeoTitle} from '@/lib/seo';
import {setLanguage} from '@/lib/i18n';
import {render,cleanup} from '@testing-library/react';
import {createElement} from 'react';
import {CmsImage} from '@/components/site/CmsImage';
afterEach(()=>{cleanup();setLanguage('tr')});
it('localizes titles before adding the brand and updates every sharing tag on navigation',()=>{
 setLanguage('en');expect(localizedSeoTitle('SCADA ve Enerji Yönetimi Çözümleri | ScadaWatt')).toBe('SCADA and Energy Management Solutions | ScadaWatt');
 applySeoMetadata('SCADA ve Enerji Yönetimi Çözümleri | ScadaWatt','ScadaWatt');
 expect(document.title).toBe('SCADA and Energy Management Solutions | ScadaWatt');
 expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute('content',document.title);
 applySeoMetadata('Veri Toplama ve Kontrol Donanımları | ScadaWatt','Güncel açıklama');
 for(const q of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])expect(document.querySelector(q)).toHaveAttribute('content','Güncel açıklama');
 expect(document.querySelectorAll('meta[name="twitter:title"]')).toHaveLength(1);
});
it('lazy loads supporting images while keeping high-priority images eager',()=>{
 render(createElement('div',null,createElement(CmsImage,{src:'/assets/test.webp',alt:'Görsel'}),createElement(CmsImage,{src:'/assets/hero.webp',alt:'Ana görsel',fetchPriority:'high'})));
 expect(document.querySelector('img[alt="Görsel"]')).toHaveAttribute('loading','lazy');expect(document.querySelector('img[alt="Ana görsel"]')).toHaveAttribute('loading','eager');
});
