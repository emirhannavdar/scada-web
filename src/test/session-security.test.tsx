import {useState} from 'react';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {SessionSecurity} from '@/components/admin/SessionSecurity';
import {SecurityPanel} from '@/components/admin/SecurityPanel';
import {adminFetch,type AdminSession} from '@/lib/admin-security';
const original={authenticated:true,csrf:'old-csrf',email:'root@example.test',role:'root' as const};
const status=(csrf='old-csrf')=>({...original,csrf,serverTime:Date.now(),idleExpires:Date.now()+900000,expires:Date.now()+28800000,reauthUntil:Date.now()-1,mfaEnabled:true,mfaRequired:true,recoveryRemaining:10});
function Harness(){const [session,setSession]=useState<AdminSession>(original),[text,setText]=useState('Kaydedilmemiş metin');return <><input aria-label="Taslak metni" value={text} onChange={event=>setText(event.target.value)}/><SessionSecurity session={session} onRenew={setSession}/></>}
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
it('renews proof before retrying a rejected operation and retains the open draft',async()=>{
 let attempts=0,fresh=false;const headers:string[]=[];
 vi.stubGlobal('fetch',vi.fn(async(path:string,options:RequestInit={})=>{
  if(path.endsWith('/security/status'))return {ok:true,status:200,json:async()=>status(fresh?'new-csrf':'old-csrf')};
  if(path.endsWith('/security/reauth')){fresh=true;expect(JSON.parse(String(options.body))).toEqual({password:'password',code:'123456',type:'totp'});return {ok:true,status:200,json:async()=>({...original,csrf:'new-csrf'})}}
  if(path.endsWith('/publish')){attempts++;headers.push(new Headers(options.headers).get('X-CSRF-Token')!);return {ok:attempts>1,status:attempts===1?428:200,json:async()=>({})}}
  throw Error(path);
 }));render(<Harness/>);let pending:Promise<Response>;await act(async()=>{pending=adminFetch('/api/cms/publish',{method:'POST',headers:{'X-CSRF-Token':'old-csrf'},body:'{"revision":4}'});await new Promise(resolve=>setTimeout(resolve,0))});
 expect(await screen.findByRole('dialog')).toHaveTextContent('Kimliğinizi doğrulayın');fireEvent.change(screen.getByLabelText('Şifre'),{target:{value:'password'}});fireEvent.change(screen.getByLabelText('6 haneli doğrulama kodu'),{target:{value:'123456'}});await act(async()=>{expect((await pending!).status).toBe(200)});expect(attempts).toBe(2);expect(headers).toEqual(['old-csrf','new-csrf']);expect(screen.getByLabelText('Taslak metni')).toHaveValue('Kaydedilmemiş metin');
});
it('does not retry or discard the draft when renewed authentication is cancelled',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>path.endsWith('/status')?{ok:true,status:200,json:async()=>status()}:{ok:false,status:401,json:async()=>({})}));render(<Harness/>);let pending:Promise<Response>;await act(async()=>{pending=adminFetch('/api/cms/draft',{method:'PUT',headers:{'X-CSRF-Token':'old-csrf'},body:'{}'});await new Promise(resolve=>setTimeout(resolve,0))});expect(await screen.findByRole('dialog')).toHaveTextContent('Oturumunuzu yenileyin');fireEvent.click(screen.getByRole('button',{name:'Bekleyen işlemi iptal et'}));await act(async()=>{expect((await pending!).status).toBe(401)});expect(screen.getByLabelText('Taslak metni')).toHaveValue('Kaydedilmemiş metin');
});
it('does not expose root settings or audit history to an admin',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>({ok:true,status:200,json:async()=>path.endsWith('/sessions')?{items:[]}:{...status(),role:'admin'}})));render(<SecurityPanel session={{...original,role:'admin'}} onClose={vi.fn()}/>);await waitFor(()=>expect(screen.queryByText('İşlem sürüyor…')).toBeNull());expect(screen.getByRole('button',{name:'İki aşamalı doğrulama'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Güvenlik geçmişi'})).toBeNull();expect(screen.queryByRole('button',{name:'Aktif oturumlar'})).toBeNull();
});
