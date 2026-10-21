import {Children,type ReactNode} from 'react';
import {useCmsDesign} from '@/lib/cms-design';
import {sectionOrder,PAGE_SECTIONS} from '../../../shared/page-sections.mjs';
import {CommunitySections} from './CommunitySections';
/** React-only ordering: no reparenting DOM, no extra layout containers. */
export function OrderedPageSections({path,children}:{path:string;children:ReactNode}){
 const design=useCmsDesign(),nodes=Children.toArray(children),ids=PAGE_SECTIONS[path]!.filter(id=>id!=='faq'&&id!=='reviews');
 return <>{sectionOrder(design,path).map(id=>id==='faq'||id==='reviews'?<CommunitySections key={id} path={path} only={id}/>:<Slot key={id}>{nodes[ids.indexOf(id)]}</Slot>)}</>;
}
function Slot({children}:{children:ReactNode}){return <>{children}</>}
