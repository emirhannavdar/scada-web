import {useSyncExternalStore} from 'react';
import {contentStatus,subscribeContentStatus,initializeContent} from '@/lib/cms-runtime';
import {translate as t,useLocale} from '@/lib/i18n';
import './content-status.css';
export function ContentStatus(){
 useLocale();const state=useSyncExternalStore(subscribeContentStatus,contentStatus,()=> 'ready');
 if(state==='ready')return null;
 return <aside className="content-status" role="status" aria-live="polite"><p>{t('Güncel içerik yüklenemedi. Geçici olarak son kullanılabilir içerik gösteriliyor.')}</p><button type="button" disabled={state==='retrying'} onClick={()=>void initializeContent()}>{t(state==='retrying'?'Yeniden yükleniyor…':'Yeniden dene')}</button></aside>;
}
