import {describe,it,expect} from 'vitest';
import {clamp,sceneIndex,chapterScrollTop} from '@/lib/scene';
describe('cinematic scene boundaries',()=>{
 it('keeps stage indices valid before and after scroll bounds',()=>{expect(sceneIndex(Number.NaN)).toBe(0);expect(sceneIndex(-1)).toBe(0);expect(sceneIndex(0)).toBe(0);expect(sceneIndex(.34)).toBe(1);expect(sceneIndex(.8)).toBe(2);expect(sceneIndex(1)).toBe(2);expect(sceneIndex(2)).toBe(2)});
 it('chapter navigation stays inside the scrollable story',()=>{for(let i=0;i<3;i++){const target=chapterScrollTop(500,4000,1000,i);expect(target).toBeGreaterThanOrEqual(500);expect(target).toBeLessThan(3500)}expect(chapterScrollTop(500,600,1000,2)).toBe(500)});
});
