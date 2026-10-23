import type {StyleRule} from '../../shared/design.mjs';
/** Render-time safeguards for navigation/footer chrome; saved CMS values are never changed. */
export function shellReadability(rule:StyleRule,selector='',context?:Element):StyleRule{
 let node=context;
 if(!node&&typeof document!=='undefined'&&selector){try{node=document.querySelector(selector)??undefined}catch{}}
 const navigation=Boolean(node?.closest('.film-header-chapters'))||selector.includes('.film-header-chapters');
 const footer=Boolean(node?.closest('[data-site-footer],.corporate-footer,.film-footer'))||/\.(corporate-footer|film-footer|site-footer)\b/.test(selector);
 if(!navigation&&!footer)return rule;
 const next={...rule};
 next.color=navigation?'var(--nav-link-color, var(--site-text))':'inherit';
 next.opacity=1;
 if(navigation){next.fontSize=13;next.fontWeight=500;next.fontFamily="var(--font-sans)";}
 if(typeof next.fontSize==='number')next.fontSize=Math.max(navigation?13:14,next.fontSize);
 if(footer&&typeof next.lineHeight==='number')next.lineHeight=Math.max(1.5,next.lineHeight);
 if(footer&&(node?.matches('[data-site-footer],.corporate-footer,.film-footer')||/\.(corporate-footer|film-footer|site-footer)$/.test(selector)))delete next.backgroundColor;
 return next;
}
