export type AdminSession={authenticated:boolean;csrf?:string;email?:string;role?:'root'|'admin';mfaEnrollmentRequired?:boolean};
export type SessionStatus=AdminSession&{serverTime:number;idleExpires:number;expires:number;reauthUntil:number;mfaEnabled:boolean;mfaRequired:boolean;recoveryRemaining:number};
type Proof='login'|'reauth';
let csrf='',listener:((kind:Proof,complete:(ok:boolean)=>void)=>void)|null=null,pending:Promise<boolean>|null=null;
export function setSessionCsrf(value:string){csrf=value}
export function installSessionPrompt(next:typeof listener){listener=next;return()=>{if(listener===next)listener=null}}
export function requestSessionProof(kind:Proof){
 if(!listener)return Promise.resolve(false);if(pending)return pending;
 pending=new Promise<boolean>(resolve=>listener?.(kind,resolve)).finally(()=>{pending=null});return pending;
}
/** Retry only a request rejected BEFORE authentication/authorization succeeds. */
export async function adminFetch(path:string,options:RequestInit={}):Promise<Response>{
 const protectedRequest=path.startsWith('/api/cms/')&&!['/api/cms/login','/api/cms/session','/api/cms/security/mfa/login','/api/cms/security/reauth','/api/cms/logout'].includes(path.split('?')[0]!);
 const send=()=>{const headers=new Headers(options.headers);if(csrf&&headers.has('X-CSRF-Token'))headers.set('X-CSRF-Token',csrf);return fetch(path,{...options,headers})};
 let response=await send();
 if(protectedRequest&&listener&&(response.status===401||response.status===428)){
  const ok=await requestSessionProof(response.status===401?'login':'reauth');if(ok)response=await send();
 }
 return response;
}
export async function securityRequest<T>(path:string,options:RequestInit={},recover=true):Promise<T>{
 const headers=new Headers(options.headers);headers.set('X-ScadaWatt-Request','cms');if(csrf)headers.set('X-CSRF-Token',csrf);if(typeof options.body==='string')headers.set('Content-Type','application/json');
 const call=recover?adminFetch:fetch,response=await call('/api/cms/security/'+path,{...options,credentials:'same-origin',headers});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'Güvenlik işlemi tamamlanamadı.'),{status:response.status});return result as T;
}
