import type {ImgHTMLAttributes} from 'react';
import {cmsAsset} from '@/lib/cms-state';
export function CmsImage(props:ImgHTMLAttributes<HTMLImageElement>){return <img {...props} src={cmsAsset(props.src)}/>}
