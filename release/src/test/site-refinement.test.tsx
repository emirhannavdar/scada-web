import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {createMemoryHistory,createRootRoute,createRouter,RouterProvider} from '@tanstack/react-router';
import {ExperienceProvider,useExperience} from '@/components/site/ExperienceContext';
import {SiteHeader} from '@/components/site/SiteHeader';
import {SiteFooter} from '@/components/site/SiteFooter';
import {CompanyPrivacyPolicy} from '@/components/site/CompanyPrivacyPolicy';
import {privacyPolicy} from '@/content/site';
import {setLanguage} from '@/lib/i18n';
afterEach(()=>{cleanup();setLanguage('tr')});
async function open(component:()=>React.ReactNode){const root=createRootRoute({component});const router=createRouter({routeTree:root,history:createMemoryHistory()});await router.load();render(<RouterProvider router={router}/>)}
function JourneyToggle(){const {journeyActive,setJourneyActive}=useExperience();return <button onClick={()=>setJourneyActive(!journeyActive)}>Toggle journey</button>}
it('keeps the bar transparent for the journey and solid for the menu and following content',async()=>{
 await open(()=> <ExperienceProvider><SiteHeader/><JourneyToggle/></ExperienceProvider>);
 const header=document.querySelector('header')!;
 expect(header).toHaveClass('is-solid');
 fireEvent.click(screen.getByText('Toggle journey'));expect(header).toHaveClass('is-flight');
 fireEvent.click(screen.getByRole('button',{name:'Menüyü aç'}));expect(header).toHaveClass('is-solid');
 fireEvent.click(screen.getByRole('button',{name:'Gezinme menüsünü kapat'}));expect(header).toHaveClass('is-flight');
 fireEvent.click(screen.getByText('Toggle journey'));expect(header).toHaveClass('is-solid');
});
it('renders all 33 official policy blocks with a single H1 and complete English copy',async()=>{
 await open(CompanyPrivacyPolicy);
 expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1);
 expect(document.querySelectorAll('[data-cms-field^="data.privacyPolicy.blocks."]')).toHaveLength(33);
 for(const block of privacyPolicy.blocks)expect(screen.getByText(block.text)).toBeInTheDocument();
 expect(screen.getAllByRole('heading',{level:2})).toHaveLength(3);
 cleanup();setLanguage('en');await open(CompanyPrivacyPolicy);
 expect(screen.getByRole('heading',{level:1})).toHaveTextContent('SCADAWATT PRIVACY POLICY');
 expect(screen.getByRole('heading',{name:'Communication Security'})).toBeInTheDocument();
});
it('removes the oversized footer wordmark and points legal links to the canonical route',async()=>{
 await open(SiteFooter);expect(document.querySelector('.film-footer-brand')).toBeNull();
 expect(screen.getByRole('link',{name:'Gizlilik'})).toHaveAttribute('href','/privacy-policy');
});
