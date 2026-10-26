import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {AdminPanel} from '@/components/admin/AdminPanel';
import {SecurityPanel} from '@/components/admin/SecurityPanel';
const user={authenticated:true,role:'root' as const,csrf:'csrf',email:'root@example.test'};
const workspace={revision:0,version:0,updated:'',device:'desktop',values:{},published:{},catalog:{fields:[]}};
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()});
it('waits for the second factor before loading a root workspace',async()=>{
 let factorCalls=0,workspaceCalls=0;
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>{
  if(path.endsWith('/session'))return {ok:true,status:200,json:async()=>({authenticated:false})};
  if(path.endsWith('/login')&&!path.endsWith('/mfa/login'))return {ok:true,status:200,json:async()=>({authenticated:false,mfaRequired:true})};
  if(path.endsWith('/mfa/login')){factorCalls++;return {ok:factorCalls>1,status:factorCalls===1?400:200,json:async()=>factorCalls===1?{error:'Kod geçersiz.'}:user}}
  if(path.includes('/workspace')){workspaceCalls++;return {ok:true,status:200,json:async()=>workspace}}
  if(path.endsWith('/status'))return {ok:true,status:200,json:async()=>({...user,mfaEnabled:true,mfaRequired:true,serverTime:Date.now(),idleExpires:Date.now()+900000,expires:Date.now()+28800000,reauthUntil:Date.now()+300000,recoveryRemaining:10})};
  return {ok:true,status:200,json:async()=>({items:[]})};
 }));render(<AdminPanel initialMode="classic"/>);fireEvent.change(await screen.findByLabelText('E-posta'),{target:{value:'root@example.test'}});fireEvent.change(screen.getByLabelText('Şifre'),{target:{value:'password'}});fireEvent.click(screen.getByRole('button',{name:'Giriş yap'}));await screen.findByLabelText('6 haneli doğrulama kodu');expect(workspaceCalls).toBe(0);
 fireEvent.change(screen.getByLabelText('6 haneli doğrulama kodu'),{target:{value:'000000'}});await screen.findByText('Kod geçersiz.');expect(workspaceCalls).toBe(0);fireEvent.change(screen.getByLabelText('6 haneli doğrulama kodu'),{target:{value:'123456'}});await screen.findByRole('button',{name:'Hesap güvenliği'});expect(workspaceCalls).toBe(1);
});
it('renders a local QR without an external image service and shows recovery codes once confirmed',async()=>{
 const codes=Array.from({length:10},(_,i)=>'AAAA-BBBB-CCCC-DDDD-000'+i);let enabled=false;
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>({ok:true,status:200,json:async()=>path.endsWith('/sessions')?{items:[]}:path.endsWith('/mfa/setup')?{secret:'JBSWY3DPEHPK3PXP',uri:'otpauth://totp/ScadaWatt%3Aroot%40example.test?secret=JBSWY3DPEHPK3PXP&issuer=ScadaWatt'}:path.endsWith('/mfa/confirm')?(enabled=true,{recoveryCodes:codes}):{...user,mfaEnabled:enabled,recoveryRemaining:enabled?10:0}})));
 render(<SecurityPanel session={user} onClose={vi.fn()}/>);await waitFor(()=>expect(screen.queryByText('İşlem sürüyor…')).toBeNull());fireEvent.click(screen.getByRole('button',{name:'2FA kurulumunu başlat'}));const qr=await screen.findByRole('img',{name:'Authenticator kurulum QR kodu'});expect(qr.querySelector('svg')).not.toBeNull();expect(qr.querySelector('img')).toBeNull();fireEvent.change(screen.getByLabelText('Uygulamadaki 6 haneli kod'),{target:{value:'123456'}});await screen.findByText(codes[0]!);expect(screen.getAllByText(/AAAA-BBBB-CCCC-DDDD/)).toHaveLength(10);expect(screen.queryByLabelText('Manuel kurulum anahtarı')).toBeNull();
});
it('holds a new admin at its own MFA setup page without loading the editor or root settings',async()=>{
 let workspaceCalls=0;const admin={...user,role:'admin',email:'editor@example.test',mfaEnrollmentRequired:true};
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>{
 if(path.endsWith('/session'))return {ok:true,status:200,json:async()=>admin};
 if(path.includes('/workspace'))workspaceCalls++;
 return {ok:true,status:200,json:async()=>path.endsWith('/sessions')?{items:[]}:{...admin,mfaEnabled:false,serverTime:Date.now(),idleExpires:Date.now()+900000,expires:Date.now()+28800000,reauthUntil:Date.now()+300000,recoveryRemaining:0}};
 }));render(<AdminPanel/>);await screen.findByRole('heading',{name:'Hesabınız sizin kontrolünüzde.'});expect(workspaceCalls).toBe(0);expect(screen.getByRole('button',{name:'Düzenlemeye geç'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Güvenlik geçmişi'})).toBeNull();expect(screen.queryByRole('dialog')).toBeNull();
});
it('sends the selected recovery type separately from the authenticator type',async()=>{
 let received:unknown;
 vi.stubGlobal('fetch',vi.fn(async(path:string,options:RequestInit={})=>{
 if(path.endsWith('/session'))return {ok:true,status:200,json:async()=>({authenticated:false})};
 if(path.endsWith('/mfa/login')){received=JSON.parse(String(options.body));return {ok:false,status:400,json:async()=>({error:'Kod geçersiz.'})}}
 if(path.endsWith('/login'))return {ok:true,status:200,json:async()=>({authenticated:false,mfaRequired:true})};
 return {ok:true,status:200,json:async()=>({})};
 }));render(<AdminPanel/>);fireEvent.change(await screen.findByLabelText('E-posta'),{target:{value:'root@example.test'}});fireEvent.change(screen.getByLabelText('Şifre'),{target:{value:'password'}});fireEvent.click(screen.getByRole('button',{name:'Giriş yap'}));fireEvent.click(await screen.findByRole('button',{name:'Kurtarma kodu kullan'}));fireEvent.change(screen.getByLabelText('Tek kullanımlık kurtarma kodu'),{target:{value:'2cf0b2c20926dd535aa6'}});expect(received).toBeUndefined();fireEvent.click(screen.getByRole('button',{name:'Kodu doğrula'}));await screen.findByText('Kod geçersiz.');expect(received).toEqual({code:'2CF0-B2C2-0926-DD53-5AA6',type:'recovery'});expect(screen.queryByText(/Altıncı rakamda/)).toBeNull();
});
it('applies structured history filters and renders readable results on a page',async()=>{
 let requested='';
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>{
 if(path.includes('/events?'))requested=path;
 return {ok:true,status:200,json:async()=>path.includes('/events?')?{items:[{id:7,created:Date.now(),actor:user.email,action:'auth.password_failed',result:'failure',ip:'203.0.113.1',agent:'Test browser'}],hasMore:false}:path.endsWith('/sessions')?{items:[]}:{...user,mfaEnabled:true}};
 }));render(<SecurityPanel session={user} onClose={vi.fn()}/>);await waitFor(()=>expect(screen.queryByText('İşlem sürüyor…')).toBeNull());fireEvent.click(screen.getByRole('button',{name:'Güvenlik geçmişi'}));await screen.findByText('Başarısız şifre',{selector:'strong'});fireEvent.change(screen.getByLabelText('Sonuç'),{target:{value:'failure'}});fireEvent.change(screen.getByLabelText('Kategori'),{target:{value:'auth'}});fireEvent.change(screen.getByLabelText('IP adresi'),{target:{value:'203.0.113.1'}});fireEvent.click(screen.getByRole('button',{name:'Filtreleri uygula'}));await waitFor(()=>{expect(requested).toContain('result=failure');expect(requested).toContain('category=auth');expect(requested).toContain('ip=203.0.113.1')});expect(screen.queryByRole('dialog')).toBeNull();
});
