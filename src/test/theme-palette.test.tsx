import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import fs from 'node:fs';
import {ExperienceProvider,useExperience} from '@/components/site/ExperienceContext';
import {createFlightWorld} from '@/lib/flight/world';
import * as T from 'three';
function Toggle(){const {fieldNight,setFieldNight}=useExperience();return <button onClick={()=>setFieldNight(!fieldNight)}>Toggle theme</button>}
afterEach(()=>{cleanup();localStorage.clear();document.querySelector('#theme-test-css')?.remove()});
function luminance(hex:string){const rgb=hex.trim().replace('#','').match(/../g)!.map(v=>{const x=parseInt(v,16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return rgb[0]!*.2126+rgb[1]!*.7152+rgb[2]!*.0722}
it('applies real palette values in both directions, with readable text and restored preferences',()=>{localStorage.clear();const css=document.createElement('style');css.id='theme-test-css';css.textContent=fs.readFileSync('src/theme.css','utf8');document.head.append(css);const view=render(<ExperienceProvider><Toggle/></ExperienceProvider>);
 for(const theme of ['light','dark','light','dark']){const styles=getComputedStyle(document.documentElement);expect(document.documentElement.dataset['theme']).toBe(theme);expect(document.documentElement.style.colorScheme).toBe(theme);const bg=luminance(styles.getPropertyValue('--site-surface'));for(const name of ['--site-text','--site-muted']){const fg=luminance(styles.getPropertyValue(name));expect((Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)).toBeGreaterThanOrEqual(4.5)}fireEvent.click(screen.getByRole('button',{name:'Toggle theme'}));}
 fireEvent.click(screen.getByRole('button',{name:'Toggle theme'}));view.unmount();render(<ExperienceProvider><Toggle/></ExperienceProvider>);expect(document.documentElement.dataset['theme']).toBe('dark');
});
it('renders one modest sunset disc without an artificial horizontal cut or a second sky sun',()=>{const w=createFlightWorld({textures:false});w.update(0,16/9);const sun=w.scene.getObjectByName('field-sun') as T.Mesh<T.PlaneGeometry,T.ShaderMaterial>;expect(sun.geometry.parameters.width).toBe(180);expect(sun.material.fragmentShader).not.toContain('normalize(vRay).y');const sunset=w.scene.children.find(o=>o instanceof T.Mesh&&(o.material as T.ShaderMaterial).fragmentShader?.includes('vec3 sunset=')) as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;expect(sunset).toBeTruthy();expect(sunset.material.fragmentShader).toContain('gl_FragColor=vec4(sunset,1.)');expect(w.scene.getObjectsByProperty('name','field-sun')).toHaveLength(1);w.dispose();});
