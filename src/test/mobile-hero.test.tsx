import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {createRootRoute,createRouter,createMemoryHistory,RouterProvider} from '@tanstack/react-router';
import {MobileHomeHero} from '@/components/site/MobileHomeHero';
afterEach(cleanup);
it('keeps both real application views and the demo destination available',async()=>{
 const root=createRootRoute({component:MobileHomeHero});
 const router=createRouter({routeTree:root,history:createMemoryHistory()});
 await router.load();render(<RouterProvider router={router}/>);
 expect(await screen.findByAltText('ScadaWatt izleme arayüzü')).toHaveAttribute('src','/assets/screens/monitor-dashboard-1.png');
 fireEvent.click(screen.getByRole('button',{name:'Mobil uygulama'}));
 expect(screen.getByAltText('ScadaWatt mobil uygulaması')).toHaveAttribute('src','/assets/app.webp');
 expect(screen.getByRole('link',{name:/Demo talebi/})).toHaveAttribute('href','/iletisim?tur=demo');
});
