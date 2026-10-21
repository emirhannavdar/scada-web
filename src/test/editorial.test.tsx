import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {ProductTheatre} from '@/components/site/ProductExperience';
import {products} from '@/content/site';
afterEach(cleanup);
it('uses genuine photographs and stable hover/focus selection without synthetic rear models',()=>{
 render(<ProductTheatre/>);for(const p of products){const button=screen.getByRole('button',{name:new RegExp(p.code)});fireEvent.mouseEnter(button);expect(button).toHaveAttribute('aria-pressed','true');const detail=screen.getByRole('region',{name:p.code+' ürün bilgileri'});expect(detail.querySelectorAll('dl>div')).toHaveLength(3);expect(detail.querySelector('img')).toHaveAttribute('src',p.image);fireEvent.mouseEnter(detail);expect(button).toHaveAttribute('aria-pressed','true');}expect(document.querySelector('canvas')).toBeNull();expect(screen.queryByRole('button',{name:'Arka yüz'})).toBeNull();
});
it('supports a hundred devices with one preview, long names, search and missing optional specifications',()=>{
 const items=Array.from({length:100},(_,i)=>({...products[0]!,slug:'device-'+i,code:'Cihaz-'+i,name:'Uzun ürün adı '+i}));render(<ProductTheatre items={items}/>);expect(document.querySelectorAll('.hardware-row')).toHaveLength(100);expect(document.querySelectorAll('.hardware-preview')).toHaveLength(1);fireEvent.focus(screen.getByRole('button',{name:/Cihaz-99/}));expect(screen.getByRole('region',{name:'Cihaz-99 ürün bilgileri'}).querySelector('a')).toHaveAttribute('href','/urunler/device-99');fireEvent.change(screen.getByRole('searchbox',{name:'Cihaz ara'}),{target:{value:'Cihaz-99'}});expect(document.querySelectorAll('.hardware-row')).toHaveLength(1);fireEvent.change(screen.getByRole('searchbox',{name:'Cihaz ara'}),{target:{value:'eşleşmeyen'}});expect(screen.getByText(/eşleşen cihaz bulunamadı/)).toBeInTheDocument();expect(document.querySelector('.hardware-preview')).toBeNull();
});
it('accepts an empty catalogue and preserves selection if items are reordered',()=>{
 const v=render(<ProductTheatre items={products}/>);fireEvent.click(screen.getByRole('button',{name:/LOMR-07H/}));v.rerender(<ProductTheatre items={[...products].reverse()}/>);expect(screen.getByRole('region',{name:'LOMR-07H ürün bilgileri'})).toBeInTheDocument();v.rerender(<ProductTheatre items={[]}/>);expect(document.querySelector('.hardware-preview')).toBeNull();
});
