import {useEffect,useMemo,useState} from 'react';
import {useRouterState} from '@tanstack/react-router';
import {useLocale} from '@/lib/i18n';
import {usePreviewReview,getPreviewReview} from '@/lib/cms-review-state';
import {previewChanges,installReviewMarks} from '@/lib/cms-preview-review';
import {applyEditorContent} from '@/lib/cms-runtime';
import {setCmsDesign} from '@/lib/cms-design';
import {revertCmsChange,type CmsChange} from '@/lib/cms-changes';
import './preview-review.css';
export function PreviewReview(){
 const {workspace,enabled}=usePreviewReview(),language=useLocale(),path=useRouterState({select:s=>s.location.pathname});
 const [dark,setDark]=useState(()=>document.documentElement.dataset['theme']==='dark'),[holding,setHolding]=useState(false);
 const changes=useMemo(()=>workspace?previewChanges(workspace,language,dark):[],[workspace,language,dark]);
 useEffect(()=>{for(const change of changes){if(change.kind==='image'&&typeof change.before.value==='string'&&/^\/(assets|uploads)\//.test(change.before.value)){const image=new Image();image.decoding='async';image.src=change.before.value;}}},[changes]);
 useEffect(()=>{const observer=new MutationObserver(()=>setDark(document.documentElement.dataset['theme']==='dark'));observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return()=>observer.disconnect()},[]);
 useEffect(()=>{
  if(!workspace||!enabled)return;
  let marks:ReturnType<typeof installReviewMarks>|undefined,timer=0,pressed=false,disposed=false,savedY=0;
  const begin=(selected:CmsChange[])=>{
   if(pressed)return;pressed=true;savedY=window.scrollY;observer.disconnect();clearTimeout(timer);setHolding(true);document.documentElement.dataset['cmsComparing']='before';
   const published=selected.reduce((before,change)=>revertCmsChange(before,change),workspace);
   setCmsDesign(published.design);applyEditorContent(published);
  };
  const end=()=>{
   if(!pressed)return;pressed=false;
   const current=getPreviewReview().workspace;
   if(current){setCmsDesign(current.design);applyEditorContent(current);}
   delete document.documentElement.dataset['cmsComparing'];setHolding(false);
   if(!disposed)timer=window.setTimeout(()=>{if(disposed)return;window.scrollTo({top:savedY,behavior:'instant'});draw();},20);
  };
  const draw=()=>{
   if(disposed||pressed)return;observer.disconnect();marks?.cleanup();marks=installReviewMarks(workspace,changes,begin,end);
   const root=document.getElementById('root');if(root)observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['src','data-active-step']});
  };
  const observer=new MutationObserver(records=>{
   if(pressed||records.every(r=>(r.target instanceof Element?r.target:r.target.parentElement)?.closest('[data-cms-chrome]')))return;
   clearTimeout(timer);timer=window.setTimeout(draw,160);
  });
  draw();
  return()=>{disposed=true;clearTimeout(timer);observer.disconnect();marks?.cleanup();end();};
 },[workspace,enabled,changes,path]);
 if(!enabled||!workspace)return null;
 return <div data-cms-chrome="true" className="cms-preview-review"><aside className="cms-review-summary"><strong role="status">{holding?'Yayındaki eski hâli':'Güncel önizleme'}</strong><span>{workspace.device==='mobile'?'Mobil':'Masaüstü'} · TR / EN · Tüm temalar</span><p>{changes.length?'İşaretli alana basılı tutun: eski hâli. Bırakın: güncel hâli.':'Bu görünümde değişiklik yok.'}</p><span>{changes.length} değişiklik</span></aside></div>;
}
