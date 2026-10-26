import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {auditDraft,auditPage,checkImages,draftRoutes,type CheckIssue} from '@/lib/preflight';
import type {VisualWorkspace} from '@/lib/cms-visual-model';
import './preflight.css';
export function PreflightPanel({workspace,path='/',getDocument,onNavigate,onMobile,onClose}:{workspace:VisualWorkspace;path?:string;getDocument?:()=>Document|null|undefined;onNavigate?:(path:string)=>void;onMobile?:()=>void;onClose:()=>void}){
 const [issues,setIssues]=useState<CheckIssue[]|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[layoutChecked,setLayoutChecked]=useState(false);
 const controller=useRef<AbortController|null>(null),dialog=useRef<HTMLDivElement>(null),generation=useRef(0),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const old=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close.current()}if(e.key==='Tab'){const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]');if(!nodes?.length)return;const first=nodes[0]!,last=nodes[nodes.length-1]!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',key);return()=>{controller.current?.abort();generation.current++;document.removeEventListener('keydown',key);old?.focus()}},[]);
 async function run(){
  controller.current?.abort();const current=++generation.current,abort=new AbortController();controller.current=abort;setBusy(true);setProgress('Taslak ve bağlantılar inceleniyor…');
  try{
   const result=auditDraft(workspace),doc=getDocument?.();setLayoutChecked(Boolean(doc?.querySelector('#main')));
   const local=doc?auditPage(doc,draftRoutes(workspace),path):[];
   const remote=await checkImages(result.images,location.origin,abort.signal,(done,total)=>{if(current===generation.current)setProgress('Görseller: '+done+' / '+total)});
   if(abort.signal.aborted||current!==generation.current)return;
   const unique=new Map<string,CheckIssue>();for(const issue of [...result.issues,...local,...remote])unique.set(JSON.stringify(issue),issue);
   setIssues([...unique.values()]);setProgress('Kontrol tamamlandı.');
  }catch{if(current===generation.current&&!abort.signal.aborted){setIssues([{severity:'warning',title:'Kontrol tamamlanamadı',detail:'Bağlantınızı kontrol edip tekrar deneyin.'}]);setProgress('')}}finally{if(current===generation.current)setBusy(false)}
 }
 const errors=issues?.filter(i=>i.severity==='error').length??0,warnings=issues?.filter(i=>i.severity==='warning').length??0;
 return createPortal(<div className="preflight-backdrop"><div className="preflight-panel" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="preflight-title"><header><div><small>YAYIN ÖNCESİ / {workspace.device==='mobile'?'MOBİL':'MASAÜSTÜ'}</small><h2 id="preflight-title">Yayın kontrolü</h2></div><button type="button" onClick={onClose} aria-label="Yayın kontrolünü kapat">×</button></header><p>Kaydedilmemiş taslak dahil metinleri, kayıtları ve görsel bağlantılarını inceler. Yerleşim kontrolü açık önizleme sayfasına uygulanır.</p><div className="preflight-actions"><button type="button" className="preflight-primary" disabled={busy} onClick={()=>void run()}>{busy?'Kontrol ediliyor…':issues?'Yeniden kontrol et':'Kontrolü başlat'}</button>{onMobile&&workspace.device!=='mobile'&&<button type="button" onClick={onMobile}>Mobil görünümde incele</button>}</div><p role="status" aria-live="polite">{progress}{issues&&!busy&&' '+errors+' hata · '+warnings+' uyarı'}</p>{issues&&<><div className="preflight-scope">{layoutChecked?'Açık sayfa: '+path:'Yerleşim kontrolü için sayfa üzerinde düzenlemeyi açın.'} Dış kaynak görsellerine bağlantı isteği gönderilmez. Bu araç SEO puanı veya yayın garantisi vermez.</div>{!issues.length&&<div className="preflight-clear">Kontrol edilen alanlarda sorun bulunamadı.</div>}<ul className="preflight-results">{issues.map((issue,index)=><li key={index} data-severity={issue.severity}><div><strong>{issue.severity==='error'?'Hata':'Uyarı'} · {issue.title}</strong><p>{issue.detail}</p></div>{issue.path&&onNavigate&&<button type="button" onClick={()=>onNavigate(issue.path!)}>Sayfayı aç</button>}</li>)}</ul></>}<footer>Kontrol otomatik yayın yapmaz. Admin → root onayı akışı korunur.</footer></div></div>,document.body);
}
