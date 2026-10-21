import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {CollectionsEditor} from '@/components/admin/CollectionsEditor';
import type {CmsCollections} from '@/lib/cms-collections';
afterEach(()=>{cleanup();vi.restoreAllMocks()});
it('creates bilingual hardware with an image and lets the resulting draft be deleted',()=>{
 const onChange=vi.fn(),onEditingChange=vi.fn();const collections:CmsCollections={products:[],solutions:[],plans:[]};const props={collections,onChange,onEditingChange,kind:'products' as const,onKind:vi.fn(),comparisonLabels:[],onImage:(_current:string,callback:(url:string)=>void)=>callback('/assets/new-device.png')};const view=render(<CollectionsEditor {...props}/>);
 fireEvent.click(screen.getByRole('button',{name:'Yeni donanım'}));fireEvent.change(screen.getByLabelText('Cihaz kodu *'),{target:{value:'SW-5000'}});
 for(const label of ['Ürün adı','Kısa başlık','Ürün açıklaması'])for(const lang of ['TR','EN']){const input=screen.getByLabelText(`${label} · ${lang} *`);fireEvent.change(input,{target:{value:`${label} ${lang}`}})}
 fireEvent.click(screen.getByRole('button',{name:'Görsel seç / yükle'}));fireEvent.submit(screen.getByRole('button',{name:'Listeye uygula'}).closest('form')!);
 expect(onChange).toHaveBeenCalledOnce();const next=onChange.mock.calls[0]![0] as CmsCollections;expect(next.products[0]!.en['name']).toBe('Ürün adı EN');expect(next.products[0]).toMatchObject({name:'Ürün adı TR',slug:'sw-5000',code:'SW-5000',image:'/assets/new-device.png'});expect(onEditingChange).toHaveBeenLastCalledWith(false);
 view.rerender(<CollectionsEditor {...props} collections={next}/>);vi.spyOn(window,'confirm').mockReturnValue(true);fireEvent.click(screen.getByRole('button',{name:'SW-5000 sil'}));expect(onChange.mock.calls.at(-1)![0].products).toEqual([]);
});
