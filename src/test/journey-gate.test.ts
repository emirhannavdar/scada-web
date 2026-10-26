import {it,expect,vi,afterEach} from 'vitest';
import {advanceJourney,installJourneyGate} from '@/lib/journey-gate';
afterEach(()=>vi.restoreAllMocks());
it('a scroll-to-end jump traverses the camera route at a bounded speed',()=>{let p=0;for(let i=0;i<60;i++){const next=advanceJourney(p,1,1/60);expect(next-p).toBeLessThanOrEqual(.22/60+.000001);p=next;}expect(p).toBeCloseTo(.22);for(let i=0;i<600;i++)p=advanceJourney(p,1,1/60);expect(p).toBe(1);expect(advanceJourney(.5,0,1/60)).toBeLessThan(.5);expect(advanceJourney(.5,1,20)-.5).toBeLessThanOrEqual(.011001);});
it('holds giant wheel and native scrollbar/key/hash jumps until the actual renderer completes',()=>{
 let y=0,done=false;vi.spyOn(window,'scrollY','get').mockImplementation(()=>y);vi.spyOn(window,'innerHeight','get').mockReturnValue(800);const section=document.createElement('section');Object.defineProperty(section,'offsetHeight',{value:5000});vi.spyOn(section,'getBoundingClientRect').mockImplementation(()=>({top:-y} as DOMRect));const scroll=vi.spyOn(window,'scrollTo').mockImplementation((options:any)=>{y=options.top});const release=installJourneyGate(section,()=>done);
 const e=new WheelEvent('wheel',{deltaY:20000,cancelable:true});window.dispatchEvent(e);expect(e.defaultPrevented).toBe(true);expect(y).toBe(4199);
 y=9000;window.dispatchEvent(new Event('scroll'));expect(y).toBe(4199);expect(scroll).toHaveBeenCalledTimes(2);
 y=3000;window.dispatchEvent(new Event('scroll'));expect(y).toBe(3000);done=true;y=9000;window.dispatchEvent(new Event('scroll'));expect(y).toBe(9000);release();
});
