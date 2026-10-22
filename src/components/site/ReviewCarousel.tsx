import {Children,useEffect,useRef,useState,type ReactNode,type CSSProperties,type PointerEvent} from 'react';
import {translate as t} from '@/lib/i18n';
type Drag={id:number;x:number;y:number;horizontal:boolean;base:number;time:number;lastX:number;velocity:number};
export function ReviewCarousel({children}:{children:ReactNode}){
 const items=Children.toArray(children),count=items.length,root=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0),[dragging,setDragging]=useState(false),[hover,setHover]=useState(false),[focused,setFocused]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false);
 const drag=useRef<Drag|null>(null),suppressClick=useRef(false),position=useRef(0),motion=useRef<number|null>(null),step=useRef(1);
 const activity=useRef({dragging,hover,focused,visible,reduced});activity.current={dragging,hover,focused,visible,reduced};
 const index=count?((active%count)+count)%count:0;
 function stopMotion(){if(motion.current!==null)cancelAnimationFrame(motion.current);motion.current=null}
 function paint(value:number){
  position.current=value;const nodes=stage.current?.children;if(!nodes||!count)return;
  Array.from(nodes).forEach((node,i)=>{
   const el=node as HTMLElement,slot=((i-value+count/2)%count+count)%count-count/2,distance=Math.abs(slot),center=distance<.5;
   el.style.transition='none';el.style.transform=`translateX(${slot*101}%) scale(${1-.18*Math.min(distance,1)})`;
   el.style.opacity=String(distance>1.15?Math.max(0,.48*(1.65-distance)/.5):1-.52*Math.min(distance,1));
   el.style.visibility=distance<1.65?'visible':'hidden';el.style.zIndex=center?'2':'1';el.style.pointerEvents=center?'auto':'none';
   el.classList.toggle('is-active',center);el.setAttribute('aria-hidden',String(!center));el.inert=!center;
  });
 }
 function settle(target:number){
  stopMotion();const from=position.current,start=performance.now(),duration=reduced?0:280;
  const frame=(now:number)=>{const progress=duration?Math.min(1,(now-start)/duration):1;paint(from+(target-from)*(1-Math.pow(1-progress,3)));if(progress<1)motion.current=requestAnimationFrame(frame);else{motion.current=null;const normalized=((target%count)+count)%count;paint(normalized);setActive(old=>old+((normalized-old%count+count)%count||count))}};
  motion.current=requestAnimationFrame(frame);
 }
 function move(direction:number){if(count>1)settle(Math.round(position.current)+direction)}
 useEffect(()=>{paint(count?active%count:0);return stopMotion},[count]);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
 useEffect(()=>{const el=root.current;if(!el)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return}const observer=new IntersectionObserver(entries=>setVisible(Boolean(entries[0]?.isIntersecting)),{threshold:.1});observer.observe(el);return()=>observer.disconnect()},[]);
 // Read the complete active comment before advancing. Pause offscreen and while interacting.
 useEffect(()=>{
  const element=stage.current?.children[index]?.querySelector<HTMLElement>('blockquote p');if(!element)return;
  let frame=0,elapsed=0,last=0,measure=0;let overflow=0,duration=3000;
  const reset=()=>{overflow=Math.max(0,element.scrollHeight-element.clientHeight);const words=(element.textContent||'').trim().split(/\s+/u).filter(Boolean).length;duration=Math.max(3000,words*260,overflow?1000+overflow/20*1000+1400:0)};
  element.scrollTop=0;reset();
  const resize=new ResizeObserver(reset);resize.observe(element);const mutation=new MutationObserver(reset);mutation.observe(element,{childList:true,characterData:true,subtree:true});
  const tick=(now:number)=>{
   const flags=activity.current,blocked=flags.dragging||flags.hover||flags.focused||!flags.visible||flags.reduced||document.hidden||drag.current!==null||motion.current!==null;
   if(!blocked){elapsed+=last?Math.min(80,now-last):0;if(now-measure>30){measure=now;const available=Math.max(1,duration-2400);element.scrollTop=overflow*Math.max(0,Math.min(1,(elapsed-1000)/available));}if(elapsed>=duration){if(count>1)move(1);return}}
   last=now;frame=requestAnimationFrame(tick);
  };
  if(!reduced&&visible)frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect()};
 },[active,count,index,visible,reduced]);
 useEffect(()=>{const update=()=>{if(!document.hidden)setActive(old=>old+count)};document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[count]);
 function down(event:PointerEvent<HTMLDivElement>){
  if(count<2||!event.isPrimary||event.pointerType==='mouse'&&event.button!==0)return;
  setFocused(false);stopMotion();suppressClick.current=false;step.current=Math.max(1,(stage.current?.getBoundingClientRect().width||300)*1.01);
  drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,horizontal:false,base:position.current,time:performance.now(),lastX:event.clientX,velocity:0};
 }
 function slide(event:PointerEvent<HTMLDivElement>){
  const current=drag.current;if(!current||current.id!==event.pointerId)return;
  const dx=event.clientX-current.x,dy=event.clientY-current.y;
  if(!current.horizontal){
   if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.35){drag.current=null;return}
   if(Math.abs(dx)<5||Math.abs(dx)<Math.abs(dy)*.75)return;
   current.horizontal=true;setDragging(true);event.currentTarget.setPointerCapture(event.pointerId);
  }
  const now=performance.now(),sample=(event.clientX-current.lastX)/Math.max(1,now-current.time);current.velocity=.55*sample+.45*current.velocity;current.time=now;current.lastX=event.clientX;
  paint(current.base-dx/step.current);if(event.cancelable)event.preventDefault();
 }
 function finish(event:PointerEvent<HTMLDivElement>,cancel=false){
  const current=drag.current;if(!current||current.id!==event.pointerId)return;
  drag.current=null;setDragging(false);
  if(current.horizontal){suppressClick.current=true;const velocity=performance.now()-current.time<100?current.velocity:0;settle(Math.round(position.current+(cancel?0:Math.max(-.8,Math.min(.8,-velocity*130/step.current)))))}
  else if(Math.abs(position.current-Math.round(position.current))>.001)settle(Math.round(position.current));
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 if(!count)return null;
 return <div ref={root} className="focus-review-carousel" onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true)}} onPointerLeave={e=>{if(e.pointerType==='mouse')setHover(false)}} onFocusCapture={e=>setFocused((e.target as HTMLElement).matches(':focus-visible'))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false)}}>
 <div className="focus-review-window" role="region" aria-roledescription={t('Yorum galerisi')} aria-label={t('Müşteri deneyimleri')} tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}}} onPointerDown={down} onPointerMove={slide} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)} onDragStart={e=>e.preventDefault()} onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false}}} data-dragging={dragging||undefined}>
 <div ref={stage} className="community-review-grid focus-review-stage">{items.map((item,i)=>{const delta=(i-index+count)%count,slot=delta===0?0:delta===count-1?-1:delta===1?1:2;return <div key={(item as {key?:string}).key??i} className={'focus-review-slot'+(slot===0?' is-active':'')} style={{'--review-slot':slot,visibility:Math.abs(slot)<=1?'visible':'hidden'} as CSSProperties} aria-hidden={slot!==0} inert={slot!==0}><div className="focus-review-card">{item}</div></div>})}</div>
 </div>
 </div>
}
