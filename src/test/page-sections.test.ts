import {describe,it,expect} from 'vitest';
import {emptyDesign,validateDesign} from '../../shared/design.mjs';
import {sectionOrder} from '../../shared/page-sections.mjs';
describe('community section ordering',()=>{
 it('keeps legacy home order and appends new sections without losing settings',()=>{
  const design=emptyDesign();design.homeOrder=['contact','hardware','solutions','discovery'];delete design.pageOrders;
  expect(validateDesign(design).homeOrder).toEqual(['contact','hardware','solutions','discovery','faq','reviews']);
 });
 it('allows FAQ and reviews between page blocks and rejects foreign section IDs',()=>{
  const design=emptyDesign();design.pageOrders={'/iletisim':['reviews','contact-form','faq']};
  expect(sectionOrder(validateDesign(design),'/iletisim/')).toEqual(['reviews','contact-form','faq']);
  design.pageOrders['/iletisim']=['hardware','contact-form','faq'];expect(()=>validateDesign(design)).toThrow();
 });
});
