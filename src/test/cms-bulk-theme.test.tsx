import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {DesignEditor} from '@/components/admin/DesignEditor';
import {emptyDesign,designKey,designCss,validateDesign,type DesignSelection} from '@/lib/cms-design';
import {cmsChanges,revertCmsChange} from '@/lib/cms-changes';
import type {VisualWorkspace} from '@/lib/cms-visual-model';
afterEach(cleanup);
it('applies a single font edit to both selected texts in only the active theme and device',()=>{
 const targets=[1,2].map(n=>{const selector=`#main > p:nth-of-type(${n})`;return {key:designKey('/',selector),selector,page:'/',label:'Metin '+n,kind:'text',locked:false,parentDisplay:'block',defaults:{fontSize:'16px'}} as DesignSelection});
 const design=emptyDesign();for(const target of targets)design.elements[target.key]={page:'/',selector:target.selector,label:target.label,kind:'text',desktop:{fontSize:16},mobile:{fontSize:14},desktopDark:{color:'#ffffff'}};
 const change=vi.fn();render(<DesignEditor design={design} selected={targets[0]!} selections={targets} onChange={change} onParent={vi.fn()} onTheme={vi.fn()} theme="light"/>);
 fireEvent.change(screen.getByRole('spinbutton',{name:'Yazı boyutu değeri'}),{target:{value:'24'}});
 const output=validateDesign(change.mock.calls.at(-1)![0]);
 for(const target of targets){expect(output.elements[target.key]!.desktopLight!.fontSize).toBe(24);expect(output.elements[target.key]!.desktopDark).toEqual({color:'#ffffff'});expect(output.elements[target.key]!.mobile).toEqual({fontSize:14});}
 expect(designCss(output,'/')).toContain('html:not([data-theme="dark"])');expect(designCss(output,'/')).toContain('html[data-theme="dark"]');
});
it('includes theme-specific edits in approval review and allows reverting them',()=>{
 const selector='#main > p:nth-of-type(1)',key=designKey('/',selector),published=emptyDesign(),design=emptyDesign();
 design.elements[key]={page:'/',selector,label:'Metin',kind:'text',desktop:{},mobile:{},mobileDark:{color:'#ffffff'}};
 const workspace={catalog:{fields:[]},values:{},published:{},design,publishedDesign:published} as unknown as VisualWorkspace;
 const changes=cmsChanges(workspace);expect(changes).toHaveLength(1);expect(changes[0]!.label).toContain('Karanlık');
 expect(revertCmsChange(workspace,changes[0]!).design!.elements[key]).toBeUndefined();
});
