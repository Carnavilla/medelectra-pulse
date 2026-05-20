import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/Spinner";
import { naira } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/courses/$id")({ component: CourseDetail });

function CourseDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrolling, setEnrolling] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
      if (error) throw error; return data;
    },
  });

  const { data: enrollment, refetch } = useQuery({
    queryKey: ["enrollment", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("enrollments")
        .select("*").eq("course_id", id).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const enroll = async () => {
    if (!user) {
      toast.info("Create an account to enroll");
      return navigate({ to: "/signup", search: { course: id } });
    }
    setEnrolling(true);
    const { error } = await supabase.from("enrollments")
      .insert({ user_id: user.id, course_id: id, access_granted: true });
    setEnrolling(false);
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success("Enrollment successful! You now have full access to this course.");
    await refetch();
    navigate({ to: "/my-course/$id", params: { id } });
  };

  if (isLoading) return <div className="min-h-screen flex flex-col"><Navbar /><Spinner label="Loading course" /></div>;
  if (!course) return null;

  const objectives = [
    "Core concepts grounded in real biomedical practice",
    "Hands-on labs with industry-standard tooling",
    "Compliance & regulatory fundamentals (HIPAA, NAFDAC, FDA)",
    "Capstone project reviewed by practitioners",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-primary">Course</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="mt-5 text-muted-foreground leading-relaxed">{course.description}</p>
            <h2 className="mt-10 text-xl font-semibold">What you'll learn</h2>
            <ul className="mt-4 space-y-2">
              {objectives.map(o => (
                <li key={o} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {o}
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-xl border border-border bg-card p-6 h-fit sticky top-24">
            <div className="aspect-video rounded-md bg-background/40 border border-border flex items-center justify-center text-xs text-muted-foreground mb-5">
              Intro Video
            </div>
            <div className="text-3xl font-bold text-primary">{naira(course.price)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime access · self-paced</p>
            {enrollment?.access_granted ? (
              <button onClick={() => navigate({ to: "/my-course/$id", params: { id } })}
                className="mt-5 w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover">
                Go to My Course
              </button>
            ) : (
              <button onClick={enroll} disabled={enrolling}
                className="mt-5 w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover disabled:opacity-50">
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </button>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
