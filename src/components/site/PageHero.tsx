import {Link} from '@tanstack/react-router';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import type { ReactNode } from 'react';
export function PageHero({ eyebrow, title, lead, children }: {
    eyebrow: string;
    title: string;
    lead?: string;
    children?: ReactNode;
}) { _useLocale(); return <section className="page-editorial"><div className="sw-wrap"><nav className="launch-breadcrumb" aria-label={_tx("Sayfa yolu")}><Link to="/">{_tx("Ana sayfa")}</Link><span aria-hidden="true">/</span><span aria-current="page">{_tx(title)}</span></nav><p data-cms-source={eyebrow} className="sw-kicker">{_tx(eyebrow)}</p><h1 data-cms-source={title}>{_tx(title)}</h1>{_tx(lead && <p data-cms-source={lead}>{_tx(lead)}</p>)}{_tx(children)}</div></section>; }
export function Draft({ children }: {
    children: ReactNode;
}) { _useLocale(); return <span className="draft-tag">{_tx(children)}</span>; }
