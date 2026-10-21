import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {GoogleReviewsCarousel} from '@/components/site/GoogleReviewsCarousel';
vi.mock('motion/react',()=>({useReducedMotion:()=>false}));
const originalObserver=globalThis.IntersectionObserver;
afterEach(()=>{cleanup();vi.unstubAllGlobals();globalThis.IntersectionObserver=originalObserver});
it('renders real API author/rating/text with controls, safe links and no duplicate reviews',async()=>{
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({enabled:true,url:'https://maps.google.com/test',reviews:[{id:'r1',name:'Reviewer A',authorUrl:'https://maps.google.com/author',photo:'',rating:5,text:'A real review '.repeat(40),date:'2 gün önce',publishTime:'',url:'https://maps.google.com/review',reportUrl:'',translated:false}],attributions:[]})});
 vi.stubGlobal('fetch',fetch);(globalThis as any).IntersectionObserver=undefined;
 render(<GoogleReviewsCarousel/>);await screen.findByText('Reviewer A');
 expect(screen.getAllByRole('article')).toHaveLength(1);
 expect(screen.getByRole('link',{name:/Yorumu Google’da aç/})).toHaveAttribute('href','https://maps.google.com/review');
 expect(screen.getByLabelText('5 / 5')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Yorumun devamı'}));expect(screen.getByRole('button',{name:'Daha az göster'})).toHaveAttribute('aria-expanded','true');
 fireEvent.click(screen.getByRole('button',{name:'Duraklat'}));expect(screen.getByRole('button',{name:'Oynat'})).toHaveAttribute('aria-pressed','true');expect(fetch).toHaveBeenCalledTimes(1);
});
