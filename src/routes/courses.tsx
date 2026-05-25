import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { naira } from "@/lib/format";
import { Spinner } from "@/components/Spinner";
import { ArrowRight } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80&auto=format&fit=crop";

function getCourseImage(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("ai") || t.includes("artificial intelligence") || t.includes("machine learning")) {
    // Robot / AI
    return "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("informatics") || t.includes("electronic records") || t.includes("ehr")) {
    // Doctor with tablet
    return "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("web") || t.includes("full-stack") || t.includes("fullstack") || t.includes("software")) {
    // Code on monitor
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("cyber") || t.includes("security") || t.includes("hacking")) {
    // Lock / security
    return "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("renewable") || t.includes("energy") || t.includes("solar") || t.includes("wind")) {
    // Solar panels
    return "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("data science") || t.includes("data analysis") || t.includes("analytics")) {
    // Data charts
    return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("biomedical") || t.includes("biomed")) {
    // Lab microscope
    return "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("medical") || t.includes("clinical") || t.includes("healthcare")) {
    // Stethoscope
    return "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80&auto=format&fit=crop";
  }
  if (t.includes("engineering")) {
    // Engineering / circuits
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop";
  }
  return FALLBACK_IMG;
}

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
  head: () => ({ meta: [{ title: "Courses — MedElectra Institute" }] }),
});

function CoursesPage() {
  const { data, isLoading } = useQuery({
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
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        <p className="text-xs uppercase tracking-widest text-primary">Programs</p>
        <h1 className="mt-2 text-4xl font-bold">Browse Courses</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Focused programs at the intersection of engineering and healthcare.
        </p>

        {isLoading ? (
          <Spinner label="Loading courses" />
        ) : (
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.map((c) => (
              <article
                key={c.id}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col teal-glow-hover"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={getCourseImage(c.title)}
                    alt={c.title}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xl font-bold text-primary">{naira(c.price)}</div>
                  <h3 className="mt-2 text-lg font-semibold leading-tight">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                    {c.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      to="/courses/$id"
                      params={{ id: c.id }}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Details
                    </Link>
                    <Link
                      to="/signup"
                      search={{ course: c.id }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold teal-glow-hover"
                    >
                      Enroll Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
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
