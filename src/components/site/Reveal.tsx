import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
export function Reveal({ children, delay = 0, y = 14, className }: {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}) { _useLocale(); const reduce = useReducedMotion(); return <motion.div className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: .45, delay: Math.min(delay, .2) }}>{_tx(children)}</motion.div>; }
export function SplitHeading({ text, className, as = 'h2' }: {
    text: string;
    className?: string;
    as?: 'h1' | 'h2';
}) { _useLocale(); const Tag = as; return <Tag data-cms-source={text} className={className}>{_tx(text)}</Tag>; }
