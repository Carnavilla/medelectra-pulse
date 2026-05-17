import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [{ count: students }, { data: courses }, { data: recent }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("id,title"),
        supabase.from("enrollments").select("*, profiles(full_name,email), courses(title)").order("enrolled_at", { ascending: false }).limit(10),
      ]);
      const perCourse = await Promise.all((courses || []).map(async c => {
        const { count } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("course_id", c.id);
        return { ...c, count: count || 0 };
      }));
      return { students: students || 0, perCourse, recent: recent || [] };
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <Stat label="Total Students" value={data?.students ?? "—"} />
        <Stat label="Total Courses" value={data?.perCourse.length ?? "—"} />
        <Stat label="Total Enrollments" value={data?.perCourse.reduce((s, c) => s + c.count, 0) ?? "—"} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Per-course enrollments</h2>
      <div className="mt-3 rounded-xl border border-border bg-card divide-y divide-border">
        {data?.perCourse.map(c => (
          <div key={c.id} className="flex items-center justify-between p-4 text-sm">
            <span>{c.title}</span><span className="font-semibold text-primary">{c.count}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Recent Enrollments</h2>
      <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Date</th></tr>
          </thead>
          <tbody>
            {data?.recent.map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.profiles?.full_name || r.profiles?.email}</td>
                <td className="p-3">{r.courses?.title}</td>
                <td className="p-3 text-muted-foreground">{new Date(r.enrolled_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold text-primary">{value}</div>
    </div>
  );
}
