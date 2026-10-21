import type {ImgHTMLAttributes} from 'react';
import {cmsAsset} from '@/lib/cms-state';
export function CmsImage(props:ImgHTMLAttributes<HTMLImageElement>){return <img decoding="async" {...props} src={cmsAsset(props.src)}/>}
