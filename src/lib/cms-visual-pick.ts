import {visualFieldMatches,type VisualTarget} from './cms-visual-model';
export type PickContext={collection?:string;record?:string;stage?:number;path?:string};
/** Text-node lookup preserves source fragments separated by <br>, icons or emphasis. */
export function pickVisualTarget(element:Element,targets:VisualTarget[],context:(el:Element)=>PickContext,point?:{x:number;y:number}){
 const explicit=element.closest<HTMLElement>('[data-cms-field]');if(explicit){const found=targets.filter(t=>t.id===explicit.dataset['cmsField']);if(found.length)return {element:explicit,found};}
 const marked=element.closest<HTMLElement>('[data-cms-source]');if(marked){const found=visualFieldMatches(targets,marked.dataset['cmsSource']||'',context(marked));if(found.length)return {element:marked,found};}
 function matches(current:Element){const ctx=context(current);if(current instanceof HTMLSelectElement){const choices=[...Array.from(current.selectedOptions),...Array.from(current.options)],found=new Map<string,VisualTarget>();for(const option of choices)for(const target of visualFieldMatches(targets,option.textContent||'',ctx))found.set(target.id,target);for(const label of Array.from(current.labels??[]))for(const target of visualFieldMatches(targets,label.textContent||'',context(label)))found.set(target.id,target);return [...found.values()];}if(current instanceof HTMLImageElement)return visualFieldMatches(targets,current.getAttribute('src')||'',ctx);
  const direct=visualFieldMatches(targets,current.textContent||'',ctx);if(direct.length)return direct;
  const walker=document.createTreeWalker(current,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement?.closest('svg,script,style,[data-cms-chrome]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});const parts:string[]=[];let node:Node|null;while((node=walker.nextNode())&&parts.length<180)parts.push(node.textContent||'');
  const spaced=visualFieldMatches(targets,parts.join(' '),ctx);if(spaced.length)return spaced;
  let caret:Node|null=null;if(point){const doc=document as Document&{caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node}|null;caretRangeFromPoint?:(x:number,y:number)=>Range|null};caret=doc.caretPositionFromPoint?.(point.x,point.y)?.offsetNode??doc.caretRangeFromPoint?.(point.x,point.y)?.startContainer??null;}
  const ordered=caret&&current.contains(caret)?[caret.textContent||'',...parts]:parts;const found=new Map<string,VisualTarget>();for(const text of ordered)for(const target of visualFieldMatches(targets,text,ctx))found.set(target.id,target);if(found.size)return [...found.values()];
  if(current instanceof HTMLInputElement||current instanceof HTMLTextAreaElement){for(const label of Array.from(current.labels??[])){for(const target of visualFieldMatches(targets,label.textContent||'',context(label)))found.set(target.id,target);}}
  for(const attribute of ['placeholder','aria-label','title'])for(const target of visualFieldMatches(targets,current.getAttribute(attribute)||'',ctx))found.set(target.id,target);
  return [...found.values()];
 }
 let current:Element|null=element;while(current&&!current.matches('body,main,html,[data-cms-chrome]')){if(!current.matches('script,style,svg,svg *,canvas,option,optgroup')){const found=matches(current);if(found.length)return {element:current as HTMLElement,found};}if(current.matches('section,nav,form'))break;current=current.parentElement;}
 return null;
}
