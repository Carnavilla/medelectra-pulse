import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { naira } from "@/lib/format";
import { Spinner } from "@/components/Spinner";
import { ArrowRight } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80&auto=format&fit=crop";

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
  head: () => ({ meta: [{ title: "Courses — MedElectra Institute" }] }),
});

function CoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at");
      if (error) throw error; return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        <p className="text-xs uppercase tracking-widest text-primary">Programs</p>
        <h1 className="mt-2 text-4xl font-bold">Browse Courses</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Five focused programs at the intersection of engineering and healthcare.</p>
        {isLoading ? <Spinner label="Loading courses" /> : (
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.map(c => (
              <article key={c.id} className="rounded-xl border border-border bg-card p-6 flex flex-col teal-glow-hover">
                <div className="aspect-video -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-muted">
                  <img
                    src={c.thumbnail_url || FALLBACK_IMG}
                    alt={c.title}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs uppercase tracking-widest text-coral">{naira(c.price)}</div>
                <h3 className="mt-3 text-lg font-semibold leading-tight">{c.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-4 flex-1">{c.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link to="/courses/$id" params={{ id: c.id }} className="text-sm text-muted-foreground hover:text-primary">
                    Details
                  </Link>
                  <Link to="/signup" search={{ course: c.id }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Enroll Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
