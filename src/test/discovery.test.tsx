import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {createRootRoute,createRouter,createMemoryHistory,RouterProvider,Outlet} from '@tanstack/react-router';
import Discovery from '@/components/site/DiscoveryExperience';
import {recommendSolutions,demoSnapshot} from '@/lib/solution-advisor';
import {applicationStories,discoveryGoals,demoScenarios} from '@/content/site';
import {setLanguage} from '@/lib/i18n';
import english from '@/content/en.json';
import fs from 'node:fs';
afterEach(()=>{cleanup();act(()=>setLanguage('tr'))});
async function open(){const root=createRootRoute({notFoundComponent:()=>null,component:()=> <><Discovery/><Outlet/></>});const router=createRouter({routeTree:root,history:createMemoryHistory()});await router.load();render(<RouterProvider router={router}/>);}
it('deduplicates recognised requirements and keeps all suggested solutions real',()=>{expect(recommendSolutions([])).toEqual([]);expect(recommendSolutions(['unknown'])).toEqual([]);expect(recommendSolutions(['generation','generation','limits']).map(s=>s.slug)).toEqual(['ges-izleme','limit-yonetimi']);expect(demoSnapshot('connection')).toMatchObject({quality:'STALE',power:780,alarmActive:true});expect(demoSnapshot(null)).toMatchObject({quality:'GOOD',alarmActive:false});expect(demoSnapshot('limit').power).toBeGreaterThan(900)});
it('carries the selected solution and enquiry into the contact link, and clears the selection',async()=>{await open();fireEvent.click(screen.getByLabelText(/Üretim performansını izlemek/));fireEvent.click(screen.getByLabelText(/kontrol ihtiyacım/));expect(screen.getByRole('link',{name:/S3000i/})).toHaveAttribute('href','/urunler/s3000i');const href=screen.getByRole('link',{name:'Seçimimle demo talep et'}).getAttribute('href')!;expect(new URL(href,'http://localhost').searchParams.get('ilgi')).toBe('GES Uzaktan İzleme');expect(href).toContain('mesaj=');fireEvent.click(screen.getByRole('button',{name:'Seçimi temizle'}));expect(screen.queryByRole('link',{name:'Seçimimle demo talep et'})).toBeNull()});
it('removes the retired scenario demo',async()=>{await open();expect(screen.queryByText('Bir olay seçin. Etkisini görün.')).toBeNull();expect(screen.queryByRole('button',{name:'Senaryoyu uygula'})).toBeNull()});
it('removes application stories in both languages',async()=>{await open();expect(screen.queryByText('Teknolojinin sahadaki karşılığı.')).toBeNull();expect(document.querySelector('#uygulama-hikayeleri')).toBeNull();act(()=>setLanguage('en'));expect(screen.queryByText('ILLUSTRATIVE SCENARIO')).toBeNull()});
it('includes English translations for all new editorial data',()=>{const missing:string[]=[];const scan=(v:unknown)=>{if(typeof v==='string'&&/[çğıöşüÇĞİÖŞÜ]/.test(v)&&!(v in english))missing.push(v);else if(Array.isArray(v))v.forEach(scan);else if(v&&typeof v==='object')Object.values(v).forEach(scan)};[applicationStories,discoveryGoals,demoScenarios].forEach(scan);expect(missing).toEqual([])});
