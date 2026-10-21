import {getLanguage} from './i18n';
import {cmsChanges,stable,type CmsChange} from './cms-changes';
import {safeSelector} from './cms-design';
import {visualTargets,normalizeVisual,type VisualWorkspace} from './cms-visual-model';
import {visualFieldMatches} from './cms-visual-model';
export function previewChanges(workspace:VisualWorkspace,_language:'tr'|'en',_dark:boolean){
 const device=workspace.device??'desktop';
 return cmsChanges(workspace).filter(change=>{
  const path=change.designPath;
  return path?.[0]!=='elements'||path[2]===device||path[2]===device+'Dark'||path[2]===device+'Light';
 });
}
export function installReviewMarks(workspace:VisualWorkspace,changes:CmsChange[],hold:(changes:CmsChange[])=>void,release:()=>void=()=>{}){
 const marked=new Map<HTMLElement,CmsChange[]>(),markers:HTMLElement[]=[],targets=visualTargets(workspace).map(target=>({...target,match:[target.value.tr,target.value.en].filter((value):value is string=>typeof value==='string').map(normalizeVisual)})),path=location.pathname.replace(/\/$/,'')||'/';
 const add=(element:HTMLElement,change:CmsChange)=>{if(element.closest('[data-cms-chrome]'))return;const found=marked.get(element)??[];if(!found.some(c=>c.id===change.id))found.push(change);marked.set(element,found);element.dataset['cmsReview']='true';};
 const beforeTargets=new Map(visualTargets({...workspace,values:workspace.published,...(workspace.publishedCollections?{collections:workspace.publishedCollections}:{})}).map(target=>[target.id,target]));
 const byTarget=new Map<string,CmsChange[]>();
 for(const target of targets){
  const before=beforeTargets.get(target.id);
  const found=changes.filter(c=>c.field===target.id||Boolean(c.collection&&target.collection&&c.collection===target.collection&&c.record===target.record&&(c.type==='add'||(c.property===target.path?.[0]&&stable(before?.value)!==stable(target.value)))));
  if(found.length)byTarget.set(target.id,found);
 }
 const candidates=document.querySelectorAll<HTMLElement>('#root :is(h1,h2,h3,h4,h5,h6,p,span,em,strong,b,small,label,legend,figcaption,blockquote,dt,dd,th,td,address,a,button,img,input,textarea)');
 for(const element of candidates){
  if(element.closest('[data-cms-chrome],svg,.cms-preview-banner'))continue;
  const owner=element.closest<HTMLElement>('[data-cms-collection]'),record=element.closest<HTMLElement>('[data-cms-record]');
  const context={path,...(owner?.dataset['cmsCollection']?{collection:owner.dataset['cmsCollection']}:{}),...(record?.dataset['cmsRecord']?{record:record.dataset['cmsRecord']}:{}),...(element.closest('.drone-copy')?{stage:Number(document.querySelector('.data-voyage')?.getAttribute('data-active-step'))}:{})};
  const field=element.getAttribute('data-cms-field');
  const values=element instanceof HTMLImageElement?[element.getAttribute('src')||'']:element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement?[element.value,element.getAttribute('placeholder')||'']:[element.textContent||'',...Array.from(element.childNodes).filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent||'')];
  const found=field?targets.filter(target=>target.id===field):values.flatMap(value=>visualFieldMatches(targets,value,context));
  for(const target of found)for(const change of byTarget.get(target.id)??[])add(element,change);
 }
 for(const change of changes){const p=change.designPath;
  if(p?.[0]==='elements'){
   const element=workspace.design?.elements[p[1]!]??workspace.publishedDesign?.elements[p[1]!];
   if(element?.page!==path||!safeSelector(element.selector))continue;
   for(const found of document.querySelectorAll<HTMLElement>(element.selector)){
    if(p[3]==='display'&&change.after.value==='none'){
     let anchor=found;while(anchor.parentElement&&anchor.parentElement!==document.body&&getComputedStyle(anchor.parentElement).display==='none')anchor=anchor.parentElement;
     const marker=document.createElement('button');marker.type='button';marker.dataset['cmsChrome']='true';marker.className='cms-review-hidden';marker.textContent='Gizlenen alan · '+element.label;marked.set(marker,[change]);anchor.before(marker);markers.push(marker);
    }else if(element.fragment&&element.fragment.language===getLanguage()){
     const walker=document.createTreeWalker(found,NodeFilter.SHOW_TEXT),runs=new Set<HTMLElement>();let node:Node|null,offset=0;
     while((node=walker.nextNode())){const start=offset;offset+=(node.textContent||'').length;if(start<element.fragment.end&&offset>element.fragment.start){const run=node.parentElement?.closest<HTMLElement>('cms-run');if(run)runs.add(run);}}
     if(runs.size)runs.forEach(run=>add(run,change));else add(found,change);
    }else add(found,change);
   }
  }
  if(change.collection&&change.type==='add'){
   for(const record of document.querySelectorAll<HTMLElement>('[data-cms-record]'))if(record.dataset['cmsRecord']===change.record&&record.closest<HTMLElement>('[data-cms-collection]')?.dataset['cmsCollection']===change.collection)add(record,change);
  }
  if(change.collection&&change.type==='remove'){
   for(const owner of document.querySelectorAll<HTMLElement>('[data-cms-collection]'))if(owner.dataset['cmsCollection']===change.collection){const marker=document.createElement('button');marker.type='button';marker.dataset['cmsChrome']='true';marker.className='cms-review-hidden';marker.textContent='Kaldırılan kayıt · '+change.label;marked.set(marker,[change]);owner.prepend(marker);markers.push(marker);}
  }
 }
 let held:number|null=null;
 const hit=(target:EventTarget|null)=>{if(!(target instanceof Element)||(target.closest('[data-cms-chrome]')&&!target.closest('.cms-review-hidden')))return null;let element:Element|null=target;while(element){const found=marked.get(element as HTMLElement);if(found)return found;element=element.parentElement;}return null;};
 const down=(event:PointerEvent)=>{if(event.button!==0||held!==null)return;const found=hit(event.target);if(!found)return;event.preventDefault();event.stopImmediatePropagation();held=event.pointerId;hold(found);};
 const up=(event?:Event)=>{if(held===null)return;if(event instanceof PointerEvent&&event.pointerId!==held)return;held=null;release();};
 const click=(event:MouseEvent)=>{if(hit(event.target)){event.preventDefault();event.stopImmediatePropagation();}};
 const key=(event:KeyboardEvent)=>{if(event.key==='Escape')up();};
 const visibility=()=>{if(document.hidden)up();};
 const surfaces:Window[]=[window];try{if(window.parent!==window&&window.parent.location.origin===location.origin)surfaces.push(window.parent);}catch{}
 window.addEventListener('pointerdown',down,true);window.addEventListener('click',click,true);
 for(const surface of surfaces){surface.addEventListener('pointerup',up,true);surface.addEventListener('pointercancel',up,true);surface.addEventListener('blur',up);}
 window.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);
 return {count:marked.size,cleanup(){up();window.removeEventListener('pointerdown',down,true);window.removeEventListener('click',click,true);for(const surface of surfaces){surface.removeEventListener('pointerup',up,true);surface.removeEventListener('pointercancel',up,true);surface.removeEventListener('blur',up);}window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);for(const element of marked.keys())element.removeAttribute('data-cms-review');markers.forEach(marker=>marker.remove());}};
}
