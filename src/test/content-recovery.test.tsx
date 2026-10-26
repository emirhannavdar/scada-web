import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {ContentStatus} from '@/components/site/ContentStatus';
import {initializeContent} from '@/lib/cms-runtime';
import {CmsImage} from '@/components/site/CmsImage';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
it('retries content in place without remounting the page',async()=>{
 const fetch=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({ok:true,json:async()=>({entries:[]})});vi.stubGlobal('fetch',fetch);vi.spyOn(console,'warn').mockImplementation(()=>{});
 render(<><canvas data-testid="scene"/><ContentStatus/></>);const canvas=screen.getByTestId('scene');await act(async()=>{await initializeContent()});expect(screen.getByRole('status')).toHaveTextContent('Güncel içerik yüklenemedi');fireEvent.click(screen.getByRole('button',{name:'Yeniden dene'}));await waitFor(()=>expect(screen.queryByRole('status')).toBeNull());expect(screen.getByTestId('scene')).toBe(canvas);expect(fetch).toHaveBeenCalledTimes(2);
});
it('replaces a broken image and retries when its source changes',async()=>{
 const view=render(<CmsImage src="/assets/missing.webp" alt="Cihaz"/>),image=screen.getByRole('img');fireEvent.error(image);expect(image).toHaveAttribute('data-image-error','true');expect(image.getAttribute('src')).toMatch(/^data:image\/svg/);
 view.rerender(<CmsImage src="/assets/fixed.webp" alt="Cihaz"/>);await waitFor(()=>expect(image).toHaveAttribute('src','/assets/fixed.webp'));expect(image).not.toHaveAttribute('data-image-error');
});
