import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/Spinner";
import { EcgBackground } from "@/components/EcgBackground";
import { Megaphone, ArrowRight, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, profile } = useAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enr } = await supabase.from("enrollments")
        .select("*, courses(*)").eq("user_id", user!.id);
      if (!enr) return [];
      const results = await Promise.all(enr.map(async (e: any) => {
        const { count: total } = await supabase.from("course_videos")
          .select("*", { count: "exact", head: true }).eq("course_id", e.course_id);
        const { count: watched } = await supabase.from("progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id).eq("course_id", e.course_id).eq("watched", true);
        const pct = total ? Math.round((watched || 0) / total * 100) : 0;
        return { ...e, total, watched, pct };
      }));
      return results;
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <section className="relative rounded-2xl border border-border bg-card overflow-hidden p-8">
          <EcgBackground />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest text-primary">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] || "Learner"}</h1>
            <p className="mt-2 text-muted-foreground">Pick up where you left off.</p>
          </div>
        </section>

        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">My Courses</h2>
            {isLoading ? <Spinner /> : enrollments?.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">You haven't enrolled yet.</p>
                <Link to="/courses" className="inline-flex mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {enrollments?.map((e: any) => (
                  <Link key={e.id} to="/my-course/$id" params={{ id: e.course_id }}
                    className="rounded-xl border border-border bg-card p-5 teal-glow-hover">
                    <h3 className="font-semibold leading-tight">{e.courses.title}</h3>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{e.watched || 0} / {e.total || 0} videos</span>
                      <span className="text-primary font-semibold">{e.pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-background/60 overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${e.pct}%` }} />
                    </div>
                    <div className="mt-4 text-sm text-primary inline-flex items-center gap-1">Continue <ArrowRight className="w-4 h-4" /></div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Megaphone className="w-4 h-4 text-coral" /> Announcements</h2>
            <div className="space-y-3">
              {announcements?.length ? announcements.map(a => (
                <div key={a.id} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No announcements yet.</p>}
            </div>

            <h2 className="mt-8 text-xl font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link to="/courses" className="block rounded-lg border border-border bg-card p-3 text-sm hover:border-primary"><ArrowRight className="inline w-3.5 h-3.5 mr-1.5 text-primary" />Browse Courses</Link>
              <Link to="/profile" className="block rounded-lg border border-border bg-card p-3 text-sm hover:border-primary"><User className="inline w-3.5 h-3.5 mr-1.5 text-primary" />My Profile</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
