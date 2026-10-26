import {afterEach,expect,it,vi} from 'vitest';
import {imageUploadSize,prepareImageUpload} from '@/lib/image-upload';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()});
it('preserves aspect ratio and never upscales images',()=>{expect(imageUploadSize(6000,4000)).toEqual({width:2560,height:1707});expect(imageUploadSize(100,80)).toEqual({width:100,height:80});});
it('retains small logos exactly and closes image resources',async()=>{
 const close=vi.fn();vi.stubGlobal('createImageBitmap',vi.fn().mockResolvedValue({width:160,height:90,close}));const file=new File(['logo'],'logo.png',{type:'image/png'});const result=await prepareImageUpload(file);expect(result.file).toBe(file);expect(result.optimized).toBe(false);expect(close).toHaveBeenCalledOnce();
});
it('resizes large images to WebP and preserves the original file object',async()=>{
 const close=vi.fn();vi.stubGlobal('createImageBitmap',vi.fn().mockResolvedValue({width:6000,height:4000,close}));const draw=vi.fn();vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:draw} as unknown as CanvasRenderingContext2D);vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(callback=>callback(new Blob(['webp'],{type:'image/webp'})));
 const file=new File([new Uint8Array(500000)],'field.jpg',{type:'image/jpeg'}),result=await prepareImageUpload(file);expect(result.file.name).toBe('field.webp');expect(result.width).toBe(2560);expect(result.height).toBe(1707);expect(file.name).toBe('field.jpg');expect(close).toHaveBeenCalledOnce();
});
it('rejects unsupported file types and excessive decoded image dimensions',async()=>{
 await expect(prepareImageUpload(new File(['x'],'file.svg'))).rejects.toThrow('PNG');vi.stubGlobal('createImageBitmap',vi.fn().mockResolvedValue({width:9000,height:9000,close:vi.fn()}));await expect(prepareImageUpload(new File(['x'],'large.png'))).rejects.toThrow('megapiksel');
});
