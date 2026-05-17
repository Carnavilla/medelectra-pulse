import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
import { EcgBackground } from "./EcgBackground";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 -z-10"><EcgBackground /></div>
      <div className="px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6"><Logo /></div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="text-2xl font-bold text-center">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground text-center">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export const inputCls =
  "w-full px-3 py-2.5 rounded-md bg-input/40 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm";
export const btnPrimary =
  "w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover disabled:opacity-50";
