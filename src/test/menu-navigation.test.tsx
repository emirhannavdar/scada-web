import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {createRootRoute,createRoute,createRouter,createMemoryHistory,RouterProvider,Outlet} from '@tanstack/react-router';
import {SiteHeader} from '@/components/site/SiteHeader';
import {ExperienceProvider} from '@/components/site/ExperienceContext';
import {setLanguage} from '@/lib/i18n';
const pages=['/','/cozumler','/urunler','/scada-yazilimi','/saha-yapilandirici','/paketler','/hakkimizda','/iletisim'];
afterEach(()=>{cleanup();setLanguage('tr');vi.restoreAllMocks()});
async function open(){const root=createRootRoute({component:()=> <ExperienceProvider><SiteHeader/><Outlet/></ExperienceProvider>});const children=pages.map(path=>createRoute({getParentRoute:()=>root,path,component:()=> <p>Page</p>}));const router=createRouter({routeTree:root.addChildren(children),history:createMemoryHistory({initialEntries:['/hakkimizda']})});await router.load();render(<RouterProvider router={router}/>);return router;}
describe('Menu page navigation',()=>{
 for(const language of ['tr','en'] as const)it(`opens every menu destination and closes the menu (${language})`,async()=>{setLanguage(language);const router=await open();for(const path of pages){fireEvent.click(screen.getByRole('button',{name:language==='tr'?'Menüyü aç':'Open menu'}));const dialog=screen.getByRole('dialog');const nav=within(dialog).getByRole('navigation');const links=within(nav).getAllByRole('link');expect(links.map(a=>a.getAttribute('href'))).toEqual(pages);const link=links[pages.indexOf(path)]!;expect(link.getAttribute('href')).not.toContain('#');fireEvent.click(link);await vi.waitFor(()=>expect(router.state.location.pathname).toBe(path));expect(screen.getByRole('button',{name:language==='tr'?'Menüyü aç':'Open menu'})).toHaveAttribute('aria-expanded','false');}});
 it('top shortcuts open their pages and CTA selects a demo request',async()=>{await open();const nav=document.querySelector('.film-header-chapters')!;expect([...nav.querySelectorAll('a')].map(a=>a.getAttribute('href'))).toEqual(pages);expect(document.querySelector('.film-header-contact')).toHaveAttribute('href','/iletisim?tur=demo');});
});
