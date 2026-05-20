import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EcgBackground } from "@/components/EcgBackground";
import { naira } from "@/lib/format";
import { ArrowRight, Cpu, Activity, ShieldCheck, Quote } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80&auto=format&fit=crop";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MedElectra Institute — Engineering with a Heartbeat" },
      { name: "description", content: "Train at the intersection of biomedical engineering, AI, and healthcare technology." },
    ],
  }),
});

function Landing() {
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <EcgBackground />
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs uppercase tracking-widest text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-coral heartbeat" />
            Biomedical · AI · Healthtech
          </div>
          <h1 className="mt-6 font-display font-bold text-5xl sm:text-7xl tracking-tight">
            Engineering with a <span className="text-primary">Heartbeat.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            MedElectra Institute trains the next generation of engineers building the future of healthcare —
            from clinical AI to wearable devices to genomics.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover">
              Explore Courses <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border hover:border-primary transition">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { Icon: Cpu, title: "Engineering Rigor", text: "Built by practitioners. Curricula grounded in real biomedical systems." },
            { Icon: Activity, title: "Clinically Relevant", text: "From HL7/FHIR to diagnostic AI — every module ties to real patient outcomes." },
            { Icon: ShieldCheck, title: "Industry-Ready", text: "FDA, NAFDAC, HIPAA — graduate ready to ship safe, compliant healthtech." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 teal-glow-hover">
              <Icon className="w-6 h-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Programs</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Our Courses</h2>
          </div>
          <Link to="/courses" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((c) => (
            <article key={c.id} className="group rounded-xl border border-border bg-card p-6 flex flex-col teal-glow-hover">
              <div className="aspect-video -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-muted">
                <img
                  src={c.thumbnail_url || FALLBACK_IMG}
                  alt={c.title}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="text-xs uppercase tracking-widest text-coral">{naira(c.price)}</div>
              <h3 className="mt-3 text-lg font-semibold leading-tight">{c.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-4 flex-1">{c.description}</p>
              <Link to="/signup" search={{ course: c.id }}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                Enroll Now <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-primary text-center">Voices</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-center">From our learners</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { q: "The clinical AI module changed how I think about model deployment in hospitals.", n: "Dr. A. Okeke", r: "Cardiology Resident" },
            { q: "Finally, a course that takes both engineering and biology seriously.", n: "K. Bello", r: "Biomedical Engineer" },
            { q: "Got hired into a healthtech startup the month after I finished the wearables course.", n: "M. Ade", r: "Embedded Engineer" },
          ].map((t) => (
            <div key={t.n} className="rounded-xl border border-border bg-card p-6">
              <Quote className="w-5 h-5 text-coral" />
              <p className="mt-4 text-sm">{t.q}</p>
              <p className="mt-4 text-sm font-semibold">{t.n}</p>
              <p className="text-xs text-muted-foreground">{t.r}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
