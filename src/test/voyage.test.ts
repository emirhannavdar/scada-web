import {it,expect} from 'vitest';
import {journeyIndex,voyageStops} from '@/lib/voyage';
import {fieldJourney,screenGallery} from '@/content/site';
import fs from 'node:fs';
it('each chapter navigation stop selects the corresponding narrative stage',()=>{expect(voyageStops).toHaveLength(fieldJourney.length);voyageStops.forEach((p,i)=>expect(journeyIndex(p)).toBe(i));expect(journeyIndex(-1)).toBe(0);expect(journeyIndex(2)).toBe(9)});
it('all real application screens ship locally',()=>{expect(screenGallery).toHaveLength(9);for(const src of screenGallery.map(s=>`/assets/screens/${s.id}.webp`))expect(fs.existsSync('public'+src)).toBe(true)});
