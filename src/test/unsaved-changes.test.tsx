import {useState} from 'react';
import {createMemoryHistory,createRootRoute,createRoute,createRouter,Link,Outlet,RouterProvider} from '@tanstack/react-router';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {hasUnsavedChanges,useUnsavedChanges,useUnsavedNavigationGuard} from '@/lib/unsaved-changes';
afterEach(()=>{cleanup();vi.restoreAllMocks()});
function Editor(){const [dirty,setDirty]=useState(false);useUnsavedChanges(dirty);useUnsavedNavigationGuard();return <><button onClick={()=>setDirty(true)}>Değiştir</button><Link to="/">Ana sayfa</Link></>}
it('blocks router navigation until the user confirms and releases dirty state on unmount',async()=>{
 const root=createRootRoute({component:Outlet}),editor=createRoute({getParentRoute:()=>root,path:'/admin',component:Editor}),home=createRoute({getParentRoute:()=>root,path:'/',component:()=> <h1>Ana sayfa</h1>});
 const router=createRouter({routeTree:root.addChildren([home,editor]),history:createMemoryHistory({initialEntries:['/','/admin'],initialIndex:1})});await router.load();render(<RouterProvider router={router}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Değiştir'}));expect(hasUnsavedChanges()).toBe(true);
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);fireEvent.click(screen.getByRole('link',{name:'Ana sayfa'}));await waitFor(()=>expect(confirm).toHaveBeenCalledOnce());expect(router.state.location.pathname).toBe('/admin');
 confirm.mockReturnValue(true);fireEvent.click(screen.getByRole('link',{name:'Ana sayfa'}));await waitFor(()=>expect(router.state.location.pathname).toBe('/'));await screen.findByRole('heading',{name:'Ana sayfa'});expect(hasUnsavedChanges()).toBe(false);
});
