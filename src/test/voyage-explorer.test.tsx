import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,act,cleanup,fireEvent} from '@testing-library/react';
import {motionValue,type MotionValue} from 'motion/react';
const state=vi.hoisted(()=>({progress:null as unknown as MotionValue<number>,rendered:(_p:number,_url:string)=>{},ready:()=>{},camera:null as unknown as MotionValue<number>,captureScroll:true,fieldNight:false}));
vi.mock('motion/react',async original=>{const m=await original<typeof import('motion/react')>();return {...m,useScroll:()=>({scrollYProgress:state.progress})};});
vi.mock('@/components/site/ExperienceContext',()=>({useExperience:()=>({reduced:false,fieldNight:state.fieldNight})}));
vi.mock('@/components/site/FlightCanvas',()=>({FlightCanvas:({screenUrl,onRendered,onReady,progress,captureScroll,fieldNight}:{screenUrl:string;onRendered:(p:number,url:string)=>void;onReady:()=>void;progress:MotionValue<number>;captureScroll:boolean;fieldNight:boolean})=>{state.rendered=onRendered;state.ready=onReady;state.camera=progress;state.captureScroll=captureScroll;state.fieldNight=fieldNight;return <div data-testid="actual-display" data-field-night={fieldNight} data-url={screenUrl}/>;} }));
import {DataVoyage} from '@/components/site/DataVoyage';
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks()});
it('finishes at one fixed home screen, waits only for that frame, and releases normal scrolling',()=>{
 vi.useFakeTimers();let y=0;vi.spyOn(window,'scrollY','get').mockImplementation(()=>y);vi.spyOn(window,'innerHeight','get').mockReturnValue(800);vi.spyOn(window,'scrollTo').mockImplementation((o:any)=>{y=o.top});state.progress=motionValue(0);render(<DataVoyage/>);
 const section=screen.getByRole('region',{name:'ScadaWatt veri yolculuğu'});Object.defineProperty(section,'offsetHeight',{value:5000});vi.spyOn(section,'getBoundingClientRect').mockImplementation(()=>({top:-y} as DOMRect));
 act(()=>state.progress.set(1));expect(state.camera.get()).toBe(0);act(()=>state.ready());act(()=>vi.advanceTimersByTime(12000));
 const display=screen.getByTestId('actual-display');expect(state.camera.get()).toBe(1);expect(display).toHaveAttribute('data-url','/assets/screens/overview-detail.webp');expect(section).toHaveAttribute('data-screen-index','0');expect(section.style.getPropertyValue('--monitor-chapter-height')).toBe('0svh');y=9000;act(()=>window.dispatchEvent(new Event('scroll')));expect(y).toBe(4199);
 act(()=>state.rendered(1,'/assets/screens/overview-detail.webp'));y=9000;act(()=>window.dispatchEvent(new Event('scroll')));expect(y).toBe(9000);
 act(()=>state.progress.set(.8));act(()=>vi.advanceTimersByTime(5000));expect(display).toHaveAttribute('data-url','/assets/screens/overview-detail.webp');expect(screen.queryByRole('button',{name:'Sonraki ekran'})).toBeNull();
});

it('uses the global field-night preference and has no city-local toggle',()=>{vi.useFakeTimers();state.fieldNight=false;state.progress=motionValue(0);const view=render(<DataVoyage/>);expect(document.querySelector('.city-day-toggle')).toBeNull();state.fieldNight=true;view.rerender(<DataVoyage/>);expect(screen.getByTestId('actual-display')).toHaveAttribute('data-field-night','true');});

it('skip jumps straight to the monitor and still waits for its rendered frame',()=>{
 vi.useFakeTimers();let y=0;vi.spyOn(window,'scrollY','get').mockImplementation(()=>y);vi.spyOn(window,'innerHeight','get').mockReturnValue(800);const scroll=vi.spyOn(window,'scrollTo').mockImplementation((o:any)=>{y=o.top});state.fieldNight=false;state.progress=motionValue(0);render(<DataVoyage/>);
 const section=screen.getByRole('region',{name:'ScadaWatt veri yolculuğu'});Object.defineProperty(section,'offsetHeight',{value:5000});vi.spyOn(section,'getBoundingClientRect').mockImplementation(()=>({top:-y} as DOMRect));act(()=>state.ready());
 fireEvent.click(screen.getByRole('link',{name:'Yolculuğu geç'}));expect(state.camera.get()).toBe(1);expect(scroll).toHaveBeenLastCalledWith({top:4199,behavior:'instant'});y=9000;act(()=>window.dispatchEvent(new Event('scroll')));expect(y).toBe(4199);
 act(()=>state.rendered(1,'/assets/screens/overview-detail.webp'));y=9000;act(()=>window.dispatchEvent(new Event('scroll')));expect(y).toBe(9000);
});

it('visual scene selection fixes the camera until the editor releases it',()=>{vi.useFakeTimers();document.documentElement.dataset['cmsVisual']='true';try{state.fieldNight=false;state.progress=motionValue(0);render(<DataVoyage/>);act(()=>state.ready());act(()=>window.dispatchEvent(new CustomEvent('scadawatt:visual',{detail:{paused:true,stage:2}})));const camera=state.camera.get();expect(camera).toBeGreaterThan(0);act(()=>state.progress.set(.9));act(()=>vi.advanceTimersByTime(2000));expect(state.camera.get()).toBe(camera);act(()=>window.dispatchEvent(new CustomEvent('scadawatt:visual',{detail:{paused:false}})));act(()=>vi.advanceTimersByTime(5000));expect(state.camera.get()).toBeGreaterThan(camera);}finally{delete document.documentElement.dataset['cmsVisual']}});
