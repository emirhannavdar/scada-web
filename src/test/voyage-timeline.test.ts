import {it,expect} from 'vitest';
import {MONITOR_START,advanceVoyageTimeline,screenTimeline,voyageTimeline} from '@/lib/voyage-timeline';
it('holds the physical camera still throughout every gallery interval and maps reverse scroll identically',()=>{
 for(let i=0;i<9;i++){const t=screenTimeline(i,9);expect(voyageTimeline(t,9)).toEqual({camera:1,screen:i});}
 expect(voyageTimeline(MONITOR_START/2,9)).toEqual({camera:.5,screen:0});expect(voyageTimeline(1,9)).toEqual({camera:1,screen:8});expect(voyageTimeline(0,9)).toEqual({camera:0,screen:0});
});
it('a huge scroll reaches all nine images in order, waiting for actual texture presentation without a wheel timer',()=>{
 let t=0,painted=-1;const displayed:number[]=[];
 for(let frame=0;frame<1200&&t<1;frame++){
  t=advanceVoyageTimeline(t,1,1/60,9,painted);const pose=voyageTimeline(t,9);
  if(pose.camera===1&&pose.screen!==painted){painted=pose.screen;displayed.push(painted);}
 }
 expect(t).toBe(1);expect(displayed).toEqual([0,1,2,3,4,5,6,7,8]);
});
it('cannot leave an image interval while its new texture is still loading',()=>{
 let t=screenTimeline(3,9);for(let i=0;i<1000;i++)t=advanceVoyageTimeline(t,1,1/60,9,2);
 expect(voyageTimeline(t,9).screen).toBe(3);expect(t).toBeLessThan(screenTimeline(4,9));
 expect(advanceVoyageTimeline(t,1,1/60,9,3)).toBeGreaterThan(t);
 expect(advanceVoyageTimeline(t,0,1/60,9,2)).toBeLessThan(t);
});
