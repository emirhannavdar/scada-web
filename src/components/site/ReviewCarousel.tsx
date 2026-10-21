import {Children,useEffect,useRef,useState,type ReactNode,type CSSProperties,type PointerEvent} from 'react';
import {translate as t} from '@/lib/i18n';
export function ReviewCarousel({children}:{children:ReactNode}){
 const items=Children.toArray(children),count=items.length,root=useRef<HTMLDivElement>(null),[active,setActive]=useState(0),[dragging,setDragging]=useState(false),[hover,setHover]=useState(false),[focused,setFocused]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false),drag=useRef<{id:number;x:number;y:number;dx:number;horizontal:boolean}|null>(null),suppressClick=useRef(false),stage=useRef<HTMLDivElement>(null);
 const index=count?active%count:0;
 function move(direction:number){setActive(old=>count?(old+direction+count)%count:0)}
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
 useEffect(()=>{const el=root.current;if(!el)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return}const observer=new IntersectionObserver(entries=>setVisible(Boolean(entries[0]?.isIntersecting)),{threshold:.1});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{if(dragging||hover||focused||!visible||reduced||count<2)return;const timer=setTimeout(()=>{if(!document.hidden)move(1)},4500);return()=>clearTimeout(timer)},[active,count,dragging,hover,focused,visible,reduced]);
 // Re-arm a complete reading interval after returning to the tab.
 useEffect(()=>{const update=()=>{if(!document.hidden)setActive(old=>old+count)};document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[count]);
 function finish(event:PointerEvent<HTMLDivElement>,cancel=false){
  const current=drag.current;if(!current||current.id!==event.pointerId)return;
  drag.current=null;setDragging(false);stage.current?.style.removeProperty('--review-drag');
  if(current.horizontal){suppressClick.current=true;if(!cancel&&Math.abs(current.dx)>Math.min(70,event.currentTarget.clientWidth*.12))move(current.dx<0?1:-1);else setActive(old=>old+count)}
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 if(!count)return null;
 return <div ref={root} className="focus-review-carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={e=>setFocused((e.target as HTMLElement).matches(':focus-visible'))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false)}}>
 <div className="focus-review-window" role="region" aria-roledescription={t('Yorum galerisi')} aria-label={t('Müşteri deneyimleri')} tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}}} onPointerDown={e=>{if(count<2||!e.isPrimary||e.button!==0)return;suppressClick.current=false;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,horizontal:false}}} onPointerMove={e=>{const current=drag.current;if(!current||current.id!==e.pointerId)return;const dx=e.clientX-current.x,dy=e.clientY-current.y;if(!current.horizontal){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){drag.current=null;return}if(Math.abs(dx)<8)return;current.horizontal=true;setDragging(true);e.currentTarget.setPointerCapture(e.pointerId)}current.dx=dx;stage.current?.style.setProperty('--review-drag',Math.max(-220,Math.min(220,dx))+'px');e.preventDefault()}} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)} onDragStart={e=>e.preventDefault()} onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false}}} data-dragging={dragging||undefined}>
 <div ref={stage} className="community-review-grid focus-review-stage">{items.map((item,i)=>{const delta=(i-index+count)%count,slot=delta===0?0:delta===count-1?-1:delta===1?1:2;const shown=Math.abs(slot)<=1;return <div key={(item as {key?:string}).key??i} className={'focus-review-slot'+(slot===0?' is-active':'')} style={{'--review-slot':slot,visibility:shown?'visible':'hidden'} as CSSProperties} aria-hidden={slot!==0} inert={slot!==0}><div className="focus-review-card">{item}</div></div>})}</div>
 </div>
 </div>
}
