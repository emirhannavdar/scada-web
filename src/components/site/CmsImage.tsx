import {useEffect,useState,type ImgHTMLAttributes} from 'react';
import {cmsAsset} from '@/lib/cms-state';
const missingImage='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#edf1ee"/><path d="M284 160h72v62h-72zM290 214l18-22 14 12 12-16 16 26" fill="none" stroke="#536b5e" stroke-width="3"/><text x="320" y="258" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#304c3b">ScadaWatt</text><text x="320" y="289" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#536b5e">Görsel yüklenemedi / Image unavailable</text></svg>');
export function CmsImage(props:ImgHTMLAttributes<HTMLImageElement>){
 const src=cmsAsset(props.src),[failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);
 return <img decoding="async" loading={props.fetchPriority==='high'?'eager':'lazy'} {...props} src={failed?missingImage:src} data-image-error={failed?'true':undefined} data-original-src={failed?src:undefined} onError={event=>{props.onError?.(event);if(!event.defaultPrevented&&!failed)setFailed(true)}}/>;
}
