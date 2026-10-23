import {afterEach,expect,it} from 'vitest';
import {shellReadability} from '@/lib/shell-readability';
import {designCss,emptyDesign} from '@/lib/cms-design';
import fs from 'node:fs';
afterEach(()=>{document.body.innerHTML=''});
it('neutralizes legacy white navigation colours without changing saved CMS settings',()=>{
 const saved={color:'#ffffff',fontSize:8,fontWeight:600};
 const normalized=shellReadability(saved,'.film-header-chapters a');
 expect(normalized.color).toBe('var(--nav-link-color, var(--site-text))');expect(normalized.fontSize).toBe(13);expect(saved).toEqual({color:'#ffffff',fontSize:8,fontWeight:600});
 const design=emptyDesign();design.elements['nav']={page:'/',selector:'.film-header-chapters a',label:'Çözümler',kind:'text',desktop:saved,mobile:{}};
 expect(designCss(design,'/')).not.toContain('color:#ffffff');
});
it('makes inherited footer word styles readable while leaving article styles alone',()=>{
 document.body.innerHTML='<footer class="site-footer" data-site-footer><p id="label">Teknoloji</p></footer><main><p id="article">Metin</p></main>';
 const saved={color:'#17301a',fontSize:7,lineHeight:1};
 const footer=shellReadability(saved,'',document.querySelector('#label')!);
 expect(footer.color).toBe('inherit');expect(footer.fontSize).toBe(14);expect(footer.lineHeight).toBe(1.5);
 expect(shellReadability(saved,'',document.querySelector('#article')!)).toBe(saved);
});
it('does not permanently highlight the configurator and does provide a colour logo mask',()=>{
 expect(fs.readFileSync('src/components/experiences/experiences.css','utf8')).not.toContain('.film-header-chapters a[href="/saha-yapilandirici"]');
 const css=fs.readFileSync('src/site-refinement.css','utf8');expect(css).toContain('[aria-current="page"]');expect(css).toContain('mask:var(--brand-mask)');
 function lum(hex:string){return hex.match(/../g)!.map(s=>parseInt(s,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i]!,0)}
 for(const [bg,fg] of [['e9eee5','4c6053'],['101c17','b7c8bc']]){const a=lum(bg!),b=lum(fg!);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThan(4.5)}
});
