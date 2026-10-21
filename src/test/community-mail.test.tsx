import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {createRootRoute,createRoute,createRouter,createMemoryHistory,RouterProvider} from '@tanstack/react-router';
import {CommunitySections} from '@/components/site/CommunitySections';
import {CommunityEditor} from '@/components/admin/CommunityEditor';
import {communityContent} from '@/content/site';
import {defaultCommunity,parseCommunity,googleReviewHref} from '../../shared/community.mjs';
import {ContactForm} from '@/components/site/ContactForm';
import {setLanguage} from '@/lib/i18n';
import {requestId} from '@/lib/request-id';
afterEach(()=>{cleanup();vi.unstubAllGlobals();communityContent.definition='{}';setLanguage('tr')});
async function show(component:()=>React.ReactNode){const root=createRootRoute({component});const router=createRouter({routeTree:root.addChildren([createRoute({getParentRoute:()=>root,path:'/'})]),history:createMemoryHistory({initialEntries:['/']})});await router.load();render(<RouterProvider router={router}/>)}
it('shows FAQs on home, hides empty testimonials and only opens validated Google destinations',async()=>{
 const d=structuredClone(defaultCommunity);d.reviews.google.enabled=true;d.reviews.google.url='https://maps.app.goo.gl/example';
 communityContent.definition=JSON.stringify(d);await show(()=> <CommunitySections path="/"/>);
 expect(screen.getAllByRole('group')).toHaveLength(5);
 expect(screen.getByRole('link',{name:/Google yorumlarını gör/})).toHaveAttribute('href',d.reviews.google.url);
 expect(screen.queryByRole('figure')).toBeNull();
 cleanup();await show(()=> <CommunitySections path="/scada-yazilimi"/>);expect(screen.queryByText('Başlamadan önce.')).toBeNull();
 expect(googleReviewHref({...d.reviews.google,url:'',placeId:'ChIJ123'})).toContain('query_place_id=ChIJ123');
});
it('adds and removes questions through the structured editor',()=>{
 const apply=vi.fn();render(<CommunityEditor value="{}" csrf="test" onApply={apply}/>);
 fireEvent.click(screen.getByRole('button',{name:'+ Soru ekle'}));fireEvent.click(screen.getByRole('button',{name:'SSS ve yorumları taslağa uygula'}));
 expect(parseCommunity(apply.mock.calls[0]![0]).faq.items).toHaveLength(6);
 fireEvent.click(screen.getAllByRole('button',{name:'Soruyu sil'})[0]!);
 fireEvent.click(screen.getByRole('button',{name:'SSS ve yorumları taslağa uygula'}));expect(parseCommunity(apply.mock.calls[1]![0]).faq.items).toHaveLength(5);
});
it('retains form values on failure and shows success only after API acceptance',async()=>{
 const send=vi.fn().mockResolvedValueOnce({ok:false,json:async()=>({error:'E-posta gönderilemedi.'})}).mockResolvedValueOnce({ok:true,json:async()=>({ok:true,reference:'ref-1'})});vi.stubGlobal('fetch',send);
 await show(()=> <ContactForm defaultInterests={['S3000i']}/>);
 fireEvent.change(screen.getByLabelText('Ad Soyad *'),{target:{value:'Ali Veli'}});fireEvent.change(screen.getByLabelText('E-posta *'),{target:{value:'ali@example.com'}});fireEvent.change(screen.getByLabelText('Mesaj *'),{target:{value:'Saham için demo talebim var.'}});
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Talebi gönder'}));await screen.findByRole('alert');expect(screen.getByLabelText('Ad Soyad *')).toHaveValue('Ali Veli');expect(screen.queryByText('Teşekkürler, talebiniz gönderildi.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Talebi gönder'}));await screen.findByText('Teşekkürler, talebiniz gönderildi.');
 expect(JSON.parse(send.mock.calls[0]![1].body).requestId).toBe(JSON.parse(send.mock.calls[1]![1].body).requestId);
 expect(requestId()).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});
