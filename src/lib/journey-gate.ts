/** Limit large native scroll jumps without skipping the camera route. */
export function advanceJourney(current:number,target:number,seconds:number){
 const delta=Math.max(-1,Math.min(1,target))-current;
 const step=Math.min(Math.abs(delta),.22*Math.min(.05,Math.max(0,seconds)),Math.abs(delta)*(1-Math.exp(-12*Math.max(0,seconds))));
 return Math.abs(delta)<.0001?target:current+Math.sign(delta)*step;
}
/** Hold only the chapter boundary while its single visual timeline catches up.
 * Native wheel, touch, keys and scrollbar still drive the SAME scroll progress.
 */
export function installJourneyGate(section:HTMLElement,isComplete:()=>boolean){
 let previous=window.scrollY,correcting=false;
 const bounds=()=>{const start=section.getBoundingClientRect().top+window.scrollY;return {start,end:start+Math.max(0,section.offsetHeight-window.innerHeight)}};
 const clamp=()=>{if(correcting||isComplete()){previous=window.scrollY;return;}const {start,end}=bounds();const y=window.scrollY;
  if(end>start&&previous<=end&&y>end-1&&y>=start){correcting=true;window.scrollTo({top:end-1,behavior:'instant'});correcting=false;previous=end-1;}else previous=y;
 };
 const wheel=(e:WheelEvent)=>{if(e.ctrlKey||isComplete()||e.deltaY<=0)return;const {start,end}=bounds(),y=window.scrollY;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1);
  if(end>start&&y>=start-1&&y<=end&&y+delta>end-1){e.preventDefault();window.scrollTo({top:end-1,behavior:'instant'});previous=end-1;}
 };
 window.addEventListener('scroll',clamp,{passive:true});window.addEventListener('wheel',wheel,{passive:false,capture:true});
 return()=>{window.removeEventListener('scroll',clamp);window.removeEventListener('wheel',wheel,true)};
}
