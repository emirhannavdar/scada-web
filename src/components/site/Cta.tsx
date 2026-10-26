import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export const ctaVariants = cva("group relative inline-flex items-center gap-3 overflow-hidden rounded-sm px-6 py-3.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60", {
    variants: {
        variant: {
            signal: "bg-signal text-foreground hover:bg-signal/80",
            ink: "surface-ink hover:bg-ink-2 hover:-translate-y-0.5",
            ghostInk: "border border-ink-line text-ink-foreground hover:border-signal hover:text-signal",
            ghost: "border border-input text-foreground hover:border-foreground",
        },
    },
    defaultVariants: { variant: "signal" },
});
type CtaProps = Omit<ComponentProps<typeof Link>, "className" | "children" | "search"> & {
    search?: Record<string, string>;
} & VariantProps<typeof ctaVariants> & {
    className?: string;
    children: React.ReactNode;
    arrow?: boolean;
};
export function Cta({ variant, className, children, arrow = true, ...props }: CtaProps) {
    _useLocale();
    return (<Link {...(props as unknown as ComponentProps<typeof Link>)} className={cn(ctaVariants({ variant }), className)}>
      <span>{_tx(children)}</span>
      {_tx(arrow && (<span className="relative grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-background/15">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-6 group-hover:translate-x-6"/>
          <ArrowUpRight className="absolute h-4 w-4 -translate-x-6 translate-y-6 transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0"/>
        </span>))}
    </Link>);
}
