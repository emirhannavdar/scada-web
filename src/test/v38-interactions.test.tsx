import {it,expect,vi,afterEach} from 'vitest';
import {render,waitFor,cleanup,act} from '@testing-library/react';
import {motionValue} from 'motion/react';
import {FlightCanvas} from '@/components/site/FlightCanvas';
import {trafficState} from '@/lib/flight/traffic';
vi.mock('@/lib/flight/render',()=>({mountFlight:(_c:unknown,_h:unknown,ready:()=>void)=>{queueMicrotask(ready);return {setProgress(){},setPaused(){},setScreen(){},screenUV:()=>null,dispose(){}};}}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
it('scrolls monitor pages from outside the monitor and releases scrolling at either boundary',async()=>{
 vi.stubGlobal('WebGL2RenderingContext',class {});let now=1000;vi.spyOn(performance,'now').mockImplementation(()=>now);
 let index=0;const navigate=vi.fn((step:number)=>{if(index+step<0||index+step>2)return false;index+=step;return true;});const progress=motionValue(.98);
 const view=render(<FlightCanvas progress={progress} onNavigate={navigate}/>);const host=view.container.querySelector('.flight-render')!;
 vi.spyOn(host,'getBoundingClientRect').mockReturnValue({top:0,left:0,right:1280,bottom:innerHeight,width:1280,height:innerHeight,x:0,y:0,toJSON(){}});
 await waitFor(()=>expect(host).toHaveAttribute('data-render-status','ready'));await act(async()=>{});
 function wheel(deltaY:number,ctrlKey=false){now+=500;const e=new WheelEvent('wheel',{deltaY,clientX:5,clientY:5,bubbles:true,cancelable:true,ctrlKey});window.dispatchEvent(e);return e;}
 expect(wheel(-80).defaultPrevented).toBe(false);expect(index).toBe(0);
 expect(wheel(80).defaultPrevented).toBe(true);expect(index).toBe(1);
 expect(wheel(80).defaultPrevented).toBe(true);expect(index).toBe(2);
 expect(wheel(80).defaultPrevented).toBe(false);expect(index).toBe(2);
 expect(wheel(-80,true).defaultPrevented).toBe(false);expect(index).toBe(2);
 expect(wheel(-80).defaultPrevented).toBe(true);expect(index).toBe(1);
});
it('holds a vehicle at a red signal then moves it on green with three vehicle types',()=>{
 const p=(seconds:number)=>.78+seconds/24*.165;
 const a=trafficState(p(4),0),b=trafficState(p(5),0),c=trafficState(p(7),0);
 expect(a.green).toBe(false);expect(b.z).toBeCloseTo(a.z);expect(c.green).toBe(true);expect(c.z).toBeGreaterThan(b.z);
 expect([0,1,2].map(i=>trafficState(.85,i).type)).toEqual([0,1,2]);expect(Math.abs(trafficState(p(11.9999),0).z-trafficState(p(12.0001),0).z)).toBeLessThan(.01);
});

it('does not paginate before the actual camera arrival even if scroll progress is near the end',async()=>{vi.stubGlobal('WebGL2RenderingContext',class {});const navigate=vi.fn(()=>true),p=motionValue(.999);const view=render(<FlightCanvas progress={p} arrivalReady={false} onNavigate={navigate}/>);const host=view.container.querySelector('.flight-render')!;vi.spyOn(host,'getBoundingClientRect').mockReturnValue({top:0,bottom:innerHeight} as DOMRect);await waitFor(()=>expect(host).toHaveAttribute('data-render-status','ready'));await act(async()=>{});window.dispatchEvent(new WheelEvent('wheel',{deltaY:100,cancelable:true}));expect(navigate).not.toHaveBeenCalled();view.rerender(<FlightCanvas progress={p} arrivalReady onNavigate={navigate}/>);window.dispatchEvent(new WheelEvent('wheel',{deltaY:100,cancelable:true}));expect(navigate).toHaveBeenCalledOnce();});
