import {it,expect,vi} from 'vitest';
import {Texture} from 'three';
import {prepareDisplayTexture} from '@/lib/flight/screen-texture';
it('letterboxes screenshots without cropping or distorting their aspect ratio',()=>{const context={fillStyle:'',fillRect:vi.fn(),drawImage:vi.fn()},spy=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as never);const image=document.createElement('img');image.width=1000;image.height=1000;const texture=new Texture(image);prepareDisplayTexture(texture);expect(context.drawImage).toHaveBeenCalledWith(image,238,0,548,548);expect(texture.image.width).toBe(1024);expect(texture.image.height).toBe(548);texture.dispose();spy.mockRestore();});
