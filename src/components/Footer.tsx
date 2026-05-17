import { Logo } from "./Logo";
import { Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Engineering with a Heartbeat. Training the next generation of healthcare technology professionals.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Get in touch</h4>
          <a href="mailto:polayinka49@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Mail className="w-4 h-4" /> polayinka49@gmail.com
          </a>
          <a href="https://wa.me/2348089574740" target="_blank" rel="noreferrer"
             className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <MessageCircle className="w-4 h-4" /> +234 808 957 4740
          </a>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">MedElectra Institute</h4>
          <p className="text-sm text-muted-foreground">
            Biomedical engineering. Health AI. Bioinformatics. Built for the future of care.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MedElectra Institute. All rights reserved.
      </div>
    </footer>
  );
}
