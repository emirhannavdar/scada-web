export const monitorMetrics={aspect:16/9,inset:50,overhead:168};
/** Physical case + stand + base fit below the fixed header, including short viewports. */
export function fitMonitor(width:number,height:number){const {aspect,inset,overhead}=monitorMetrics;const w=Math.max(1,Math.min(width,Math.max(1,(height-overhead)*aspect+inset)));return {width:w,height:overhead+Math.max(0,w-inset)/aspect};}
export function containImage(iw:number,ih:number,w:number,h:number){const ratio=Math.min(w/iw,h/ih);return {width:iw*ratio,height:ih*ratio};}
