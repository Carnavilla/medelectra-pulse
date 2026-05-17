import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { naira } from "@/lib/format";
import { Spinner } from "@/components/Spinner";
import { ArrowRight } from "lucide-react";

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
                <div className="text-xs uppercase tracking-widest text-coral">{naira(c.price)}</div>
                <h3 className="mt-3 text-lg font-semibold leading-tight">{c.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-4 flex-1">{c.description}</p>
                <Link to="/courses/$id" params={{ id: c.id }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Enroll Now <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
