import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [
        { count: totalStudents },
        { count: totalEnrollments },
        { data: courses },
        { data: recent },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("id,title"),
        supabase
          .from("enrollments")
          .select("id, enrolled_at, access_granted, profiles(full_name, email), courses(title)")
          .order("enrolled_at", { ascending: false })
          .limit(8),
      ]);

      const perCourse = await Promise.all(
        (courses || []).map(async (c) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", c.id);
          return { ...c, count: count || 0 };
        })
      );

      return {
        totalStudents: totalStudents || 0,
        totalEnrollments: totalEnrollments || 0,
        totalCourses: courses?.length || 0,
        perCourse,
        recent: recent || [],
      };
    },
  });

  const stats = [
    { label: "Total Students",    value: data?.totalStudents,    icon: Users,          color: "text-primary" },
    { label: "Total Courses",     value: data?.totalCourses,     icon: BookOpen,       color: "text-primary" },
    { label: "Total Enrollments", value: data?.totalEnrollments, icon: GraduationCap,  color: "text-primary" },
    {
      label: "Avg per Course",
      value: data?.totalCourses
        ? Math.round((data.totalEnrollments / data.totalCourses) * 10) / 10
        : 0,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome to the MedElectra admin panel.</p>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <Icon className={`w-4 h-4 ${color} opacity-60`} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {isLoading ? <span className="text-muted-foreground">—</span> : value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-5 gap-6">
        {/* Recent enrollments table */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Recent Enrollments</h2>
            <Link to="/admin/enrollments" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Access</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>
                ) : data?.recent.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">No enrollments yet.</td></tr>
                ) : (
                  data?.recent.map((r: any) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[140px]">{r.profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{r.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">{r.courses?.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          r.access_granted
                            ? "bg-primary/15 text-primary"
                            : "bg-coral/15 text-coral"
                        }`}>
                          {r.access_granted ? "Granted" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-course breakdown */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Enrollments by Course</h2>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : data?.perCourse.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No courses yet.</div>
            ) : (
              data?.perCourse.map((c) => {
                const max = Math.max(...(data.perCourse.map((x) => x.count)), 1);
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{c.title}</span>
                      <span className="font-semibold text-primary shrink-0">{c.count}</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-background/60 overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick links */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { to: "/admin/users",         label: "Manage Students" },
              { to: "/admin/enrollments",   label: "Enrollments" },
              { to: "/admin/courses",       label: "Edit Courses" },
              { to: "/admin/announcements", label: "Announce" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium hover:border-primary transition-colors text-center"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
