import {disposeFlightSession} from '@/lib/flight/session';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,waitFor,act,cleanup} from '@testing-library/react';
import {motionValue} from 'motion/react';
const state=vi.hoisted(()=>({ready:null as null|(()=>void),progress:null as null|((v:number)=>void)}));
vi.mock('@/components/site/ExperienceContext',()=>({useExperience:()=>({menuOpen:false})}));
vi.mock('@/lib/flight/render',()=>({mountFlight:(_c:unknown,_h:unknown,ready:()=>void,_error:unknown,progress:(v:number)=>void)=>{state.ready=ready;state.progress=progress;return {setProgress(){},setPaused(){},dispose(){}}}}));
import {FlightCanvas} from '@/components/site/FlightCanvas';
afterEach(()=>{cleanup();disposeFlightSession();vi.unstubAllGlobals();state.ready=null;state.progress=null;document.body.style.overflow='';document.getElementById('root')?.remove()});
describe('initial loading gate',()=>{
 it('keeps the page blocked until model loading and warm-up report ready, then restores access',async()=>{vi.stubGlobal('WebGL2RenderingContext',class {});const root=document.createElement('div');root.id='root';document.body.append(root);render(<FlightCanvas progress={motionValue(0)}/>,{container:root});expect(screen.getByRole('status')).toBeInTheDocument();expect(document.body.style.overflow).toBe('hidden');expect(root.inert).toBe(true);await waitFor(()=>expect(state.ready).not.toBeNull());act(()=>state.progress?.(.54));expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','54');act(()=>state.ready?.());expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(document.body.style.overflow).toBe('');expect(root.inert).toBe(false);});
});
