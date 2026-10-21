import {afterEach,describe,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {createRouter,createMemoryHistory,RouterProvider} from '@tanstack/react-router';
import {QueryClient} from '@tanstack/react-query';
import {routeTree} from '@/routeTree.gen';
import {ContactForm} from '@/components/site/ContactForm';
import {products,solutions,productSpecifications,images} from '@/content/site';
import fs from 'node:fs';
afterEach(()=>{cleanup();sessionStorage.clear()});
async function open(path='/'){const router=createRouter({routeTree,context:{queryClient:new QueryClient()},history:createMemoryHistory({initialEntries:[path]})});await router.load();render(<RouterProvider router={router}/>);return router}
describe('ScadaWatt project',()=>{
 it('bundles genuine media files instead of editor asset URLs',()=>{for(const src of [...Object.values(images),...products.map(p=>p.image)]){expect(src.startsWith('/assets/')).toBe(true);expect(fs.existsSync('public'+src)).toBe(true)}});
 it('all solution and product pages resolve their own loader data',async()=>{for(const p of products){const r=createRouter({routeTree,context:{queryClient:new QueryClient()},history:createMemoryHistory({initialEntries:['/urunler/'+p.slug]})});await r.load();expect(r.state.matches.at(-1)?.loaderData).toEqual(p)}for(const s of solutions){const r=createRouter({routeTree,context:{queryClient:new QueryClient()},history:createMemoryHistory({initialEntries:['/cozumler/'+s.slug]})});await r.load();expect(r.state.matches.at(-1)?.loaderData).toEqual(s)}});
 it('keeps each product specification table separate',()=>{expect(productSpecifications['s3000i']?.find(s=>s.name==='Hafıza')?.value).toBe('12GB Dahili');expect(productSpecifications['s4000mc']?.some(s=>s.name==='Hafıza')).toBe(false);expect(productSpecifications['lomr-07h']?.find(s=>s.name==='Koruma Sınıfı')?.value).toBe('IP30')});
 it('uses one real-photo detail pane selected from a vertical device list',async()=>{await open();const button=await screen.findByRole('button',{name:/LOMR-07H/});expect(document.querySelectorAll('.hardware-row')).toHaveLength(3);expect(document.querySelector('.hardware-preview img')).toHaveAttribute('src','/assets/s3000i.webp');fireEvent.mouseEnter(button);const detail=await screen.findByRole('region',{name:'LOMR-07H ürün bilgileri'});expect(detail.querySelector('a')).toHaveAttribute('href','/urunler/lomr-07h');expect(document.querySelectorAll('.hardware-photo')).toHaveLength(1);});
 it('Escape closes the immersive menu and restores the trigger',async()=>{await open();const button=await screen.findByRole('button',{name:'Menüyü aç'});fireEvent.click(button);expect(screen.getByRole('dialog',{name:'ScadaWatt navigasyonu'})).toBeInTheDocument();fireEvent.keyDown(document,{key:'Escape'});expect(button).toHaveAttribute('aria-expanded','false');expect(document.activeElement).toBe(button)});
 it('home keeps the physical monitor and has no side information panel or duplicate gallery',async()=>{await open();expect(document.querySelectorAll('.voyage-screen-controls')).toHaveLength(0);expect(document.querySelector('.flight-screen-arrival')).toBeNull();expect(document.querySelector('.screen-explorer')).toBeNull();});
 it('opening uses a 3D canvas and never the supplied field as a flat photo',async()=>{await open();expect(await screen.findByRole('heading',{level:1,name:/Verinin/})).toBeInTheDocument();expect(document.querySelector('.flight-render canvas')).not.toBeNull();expect(document.querySelector('img[src="/assets/screens/field.webp"]')).toBeNull();expect(document.querySelector('.flight-location')).toBeNull();expect(document.querySelector('.drone-steps')).toBeNull()});

 it('has no pause control and ignores the retired stored motion switch',async()=>{sessionStorage.setItem('scadawatt-motion','reduced');await open();expect(screen.queryByRole('button',{name:'Hareketi azalt'})).toBeNull();expect(document.querySelector('.simple-journey')).toBeNull();expect(sessionStorage.getItem('scadawatt-motion')).toBeNull()});
 it('solution selection changes the editorial application view and detail link',async()=>{await open();const button=await screen.findByRole('tab',{name:/Zero Injection/});fireEvent.click(button);expect(button).toHaveAttribute('aria-selected','true');await waitFor(()=>expect(screen.getByRole('link',{name:'Çözümü inceleyin'})).toHaveAttribute('href','/cozumler/zero-injection'));expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby','solution-tab-zero-injection');expect(document.querySelector('.solution-workbench')).toBeNull();});
 it('solution tabs support arrow, Home and End keyboard navigation',async()=>{await open();const first=await screen.findByRole('tab',{name:/Enerji Yönetimi/});first.focus();fireEvent.keyDown(first,{key:'End'});expect(screen.getByRole('tab',{name:/Zero Injection/})).toHaveAttribute('aria-selected','true');fireEvent.keyDown(document.activeElement!,{key:'ArrowUp'});expect(screen.getByRole('tab',{name:/Kompanzasyon/})).toHaveAttribute('aria-selected','true');fireEvent.keyDown(document.activeElement!,{key:'Home'});expect(first).toHaveAttribute('aria-selected','true');expect(document.activeElement).toBe(first);});
 it('web/mobile gallery switches real image sources',async()=>{await open('/scada-yazilimi');fireEvent.click(await screen.findByRole('button',{name:'Mobil uygulama'}));expect(screen.getByAltText('Mevcut ScadaWatt mobil uygulama tanıtım görseli')).toHaveAttribute('src',images.app)});
});

it('creates a reviewable local draft without claiming successful delivery',async()=>{
 render(<ContactForm/>);
 fireEvent.change(screen.getByLabelText('Ad Soyad *'),{target:{value:'Ali Veli'}});
 fireEvent.change(screen.getByLabelText('E-posta *'),{target:{value:'ali@example.com'}});
 fireEvent.change(screen.getByLabelText('Telefon (isteğe bağlı)'),{target:{value:'03122555586'}});
 fireEvent.change(screen.getByLabelText('İlgilendiğiniz ürün / hizmet *'),{target:{value:'S3000i'}});
 fireEvent.change(screen.getByLabelText('Mesaj *'),{target:{value:'S3000i cihazı için bilgi almak istiyorum.'}});
 fireEvent.click(screen.getByRole('checkbox'));
 fireEvent.click(screen.getByRole('button',{name:'Talep taslağını oluştur'}));
 expect(await screen.findByText('Talebiniz hazır.')).toBeInTheDocument();
 expect((screen.getByLabelText('Talep taslağı') as HTMLTextAreaElement).value).toContain('Ali Veli');
 expect(screen.getByRole('link',{name:'E-posta uygulamasında aç'}).getAttribute('href')).toContain('mailto:info@scadawatt.com');
});

it('places a shared sun/moon control beside contact in the header',async()=>{await open();const button=await screen.findByRole('button',{name:'Gece temasına geç'});expect(button.previousElementSibling).toHaveClass('film-header-contact');expect(button).toHaveAttribute('aria-pressed','false');fireEvent.click(button);expect(screen.getByRole('button',{name:'Gündüz temasına geç'})).toHaveAttribute('aria-pressed','true');expect(document.querySelector('.city-day-toggle')).toBeNull();});
