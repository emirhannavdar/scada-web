import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {ReviewCarousel} from '@/components/site/ReviewCarousel';
const originalIntersection=globalThis.IntersectionObserver;
let clock=0,id=0,frames=new Map<number,FrameRequestCallback>();
function advance(ms:number){act(()=>{const end=clock+ms;while(clock<end){clock+=16;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(clock))}})}
function cards(){return render(<ReviewCarousel>{['Short review.',Array(150).fill('ScadaWatt provides energy monitoring').join(' '),'Third review.','Fourth review.'].map((message,i)=><figure key={i}><blockquote><span>“</span><p>{message}</p></blockquote><figcaption>Customer {i}</figcaption></figure>)}</ReviewCarousel>)}
beforeEach(()=>{
 clock=0;frames.clear();vi.spyOn(performance,'now').mockImplementation(()=>clock);
 vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{frames.set(++id,fn);return id});vi.stubGlobal('cancelAnimationFrame',(n:number)=>frames.delete(n));
 globalThis.IntersectionObserver=class{constructor(private cb:IntersectionObserverCallback){}observe(){this.cb([{isIntersecting:true} as IntersectionObserverEntry],this as unknown as IntersectionObserver)}disconnect(){}} as unknown as typeof IntersectionObserver;
 vi.stubGlobal('PointerEvent',class extends MouseEvent{pointerId:number;pointerType:string;isPrimary:boolean;constructor(type:string,init:PointerEventInit={}){super(type,init);this.pointerId=init.pointerId??1;this.pointerType=init.pointerType??'touch';this.isPrimary=init.isPrimary??true}});
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({width:300,height:350,x:0,y:0,top:0,left:0,right:300,bottom:350,toJSON(){}});
 Object.defineProperty(HTMLElement.prototype,'setPointerCapture',{configurable:true,value:()=>{}});Object.defineProperty(HTMLElement.prototype,'hasPointerCapture',{configurable:true,value:()=>false});
 vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(160);vi.spyOn(HTMLElement.prototype,'scrollHeight','get').mockImplementation(function(this:HTMLElement){return (this.textContent?.length||0)>200?1200:140});
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
});
afterEach(()=>{cleanup();globalThis.IntersectionObserver=originalIntersection;vi.restoreAllMocks();vi.unstubAllGlobals()});
it('touch drag moves through multiple cards before release, then settles',()=>{
 const {container}=cards(),window=container.querySelector('.focus-review-window')!;fireEvent.pointerDown(window,{pointerType:'touch',isPrimary:true,pointerId:1,button:-1,clientX:300,clientY:20});
 fireEvent.pointerMove(window,{pointerType:'touch',isPrimary:true,pointerId:1,clientX:-150,clientY:28});const first=container.querySelector('.focus-review-slot')!.getAttribute('style');
 fireEvent.pointerMove(window,{pointerType:'touch',isPrimary:true,pointerId:1,clientX:-450,clientY:30});expect(container.querySelector('.focus-review-slot')!.getAttribute('style')).not.toBe(first);expect(container.querySelectorAll('.focus-review-slot')[2]).toHaveAttribute('aria-hidden','false');
 fireEvent.pointerUp(window,{pointerType:'touch',isPrimary:true,pointerId:1,clientX:-450,clientY:30});advance(500);expect(container.querySelectorAll('.focus-review-slot')[3]).toHaveAttribute('aria-hidden','false');
});
it('a touch does not create a sticky mouse hover; short comments advance in about 3 seconds',()=>{
 const {container}=cards();fireEvent.pointerEnter(container.querySelector('.focus-review-carousel')!,{pointerType:'touch'});advance(3400);expect(container.querySelectorAll('.focus-review-slot')[1]).toHaveAttribute('aria-hidden','false');
});
it('long messages scroll internally and stay centered longer than short comments',()=>{
 const {container}=cards();advance(3400);advance(10000);const active=container.querySelectorAll('.focus-review-slot')[1]!;expect(active).toHaveAttribute('aria-hidden','false');expect(active.querySelector('p')!.scrollTop).toBeGreaterThan(0);
});
