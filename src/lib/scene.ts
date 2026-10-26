export const clamp=(n:number,min=0,max=1)=>Number.isNaN(n)?min:Math.min(max,Math.max(min,n));
export function sceneIndex(progress:number,count=3){return Math.min(count-1,Math.floor(clamp(progress)*count))}
export function chapterScrollTop(top:number,height:number,viewport:number,index:number,count=3){return top+Math.max(0,height-viewport)*(index+.35)/count}
