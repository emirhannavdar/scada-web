import type {FlightRenderer} from './render';
type Callbacks={ready:()=>void;error:()=>void;progress:(value:number)=>void;frame:(progress:number,url:string)=>void};
type Session={root:HTMLDivElement;canvas:HTMLCanvasElement;engine:FlightRenderer|null;ready:boolean;loaded:number;failed:boolean;owner:Callbacks|null};
let session:Session|null=null;
export function hasPreparedFlight(){return Boolean(session?.ready&&!session.failed)}
/** One GPU world per document. Route changes park it without rendering or rebuilding it. */
export function acquireFlight(surface:HTMLElement,callbacks:Callbacks){
 let current=session;if(!current||current.failed){const root=document.createElement('div'),canvas=document.createElement('canvas');root.className='flight-session';root.style.cssText='position:absolute;inset:0';canvas.setAttribute('aria-hidden','true');root.append(canvas);current={root,canvas,engine:null,ready:false,loaded:0,failed:false,owner:callbacks};session=current;const own=current;
  import('./render').then(({mountFlight})=>{if(session!==own)return;try{own.engine=mountFlight(own.canvas,own.root,()=>{own.ready=true;own.owner?.ready()},()=>{own.failed=true;own.ready=false;own.owner?.error();own.engine?.dispose();own.engine=null;},value=>{own.loaded=value;own.owner?.progress(value)},(p,url)=>own.owner?.frame(p,url));if(!own.owner)own.engine.setPaused(true);}catch{own.failed=true;own.owner?.error()}}).catch(()=>{own.failed=true;own.owner?.error()});
 }
 current.owner=callbacks;surface.append(current.root);const own=current;callbacks.progress(own.loaded);if(own.ready)queueMicrotask(()=>{if(own.owner===callbacks)callbacks.ready()});own.engine?.resize();own.engine?.setPaused(false);
 return {get engine(){return own.engine},release(){if(own.owner!==callbacks)return;own.owner=null;own.engine?.setPaused(true);own.root.remove()}};
}
export function disposeFlightSession(){const current=session;session=null;if(current){current.owner=null;current.engine?.dispose();current.root.remove()}}
if(typeof window!=='undefined'){window.addEventListener('pagehide',event=>{if(!(event as PageTransitionEvent).persisted)disposeFlightSession()});}
