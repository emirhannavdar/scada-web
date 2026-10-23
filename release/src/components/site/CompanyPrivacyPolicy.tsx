import {privacyPolicy} from '@/content/site';
import {translate as t,useLocale} from '@/lib/i18n';
import {PageHero} from './PageHero';
export function CompanyPrivacyPolicy(){
 useLocale();
 return <><PageHero eyebrow={t('Yasal')} title={t(privacyPolicy.title)}/>
 <article className="sw-wrap policy-copy company-privacy" aria-label={t(privacyPolicy.title)}>
 {privacyPolicy.blocks.map((block,index)=>{
  const Tag=block.type==='heading'?'h2':block.type==='subheading'?'h3':'p';
  return <Tag key={index} data-cms-field={`data.privacyPolicy.blocks.${index}.text`}>{t(block.text)}</Tag>;
 })}
 </article></>;
}
