import {advanceJourney} from './journey-gate';
/** The final 38% of the sticky chapter is the monitor gallery, not more camera travel. */
export const MONITOR_START=.62;
export function voyageTimeline(value:number,count:number){
 const t=Math.max(0,Math.min(1,value)),size=Math.max(1,count);
 return {camera:Math.min(1,t/MONITOR_START),screen:Math.max(0,Math.min(size-1,Math.floor((t-MONITOR_START)/(1-MONITOR_START)*size)))};
}
export function screenTimeline(index:number,count:number){return MONITOR_START+(Math.max(0,Math.min(count-1,index))+.5)/Math.max(1,count)*(1-MONITOR_START);}
/** No per-wheel timers or page counters. Fast scroll traverses all screen intervals.
 * An interval cannot be left forwards until that screen was actually rendered.
 */
export function advanceVoyageTimeline(current:number,target:number,seconds:number,count:number,painted:number){
 const next=advanceJourney(current,target,seconds*MONITOR_START);
 if(target<=current||current<MONITOR_START)return Math.min(next,target>current&&current<MONITOR_START?MONITOR_START:1);
 const page=voyageTimeline(current,count).screen;
 if(page===painted)return next;
 const boundary=MONITOR_START+(page+1)/Math.max(1,count)*(1-MONITOR_START);
 return Math.min(next,boundary-.000001);
}
