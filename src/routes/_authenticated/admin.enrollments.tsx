import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/enrollments")({ component: AdminEnrollments });

function AdminEnrollments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data: courses } = useQuery({
    queryKey: ["c-list"],
    queryFn: async () => (await supabase.from("courses").select("id,title")).data || [],
  });
  const { data: enrollments } = useQuery({
    queryKey: ["all-enrollments", filter],
    queryFn: async () => {
      let q = supabase.from("enrollments").select("*, profiles(full_name,email), courses(title)").order("enrolled_at", { ascending: false });
      if (filter) q = q.eq("course_id", filter);
      return (await q).data || [];
    },
  });

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("enrollments").update({ access_granted: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Access updated");
    qc.invalidateQueries({ queryKey: ["all-enrollments"] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Enrollments</h1>
      <select className="mt-4 px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
              value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">All courses</option>
        {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
      <div className="mt-4 rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-background/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Date</th><th className="p-3">Access</th></tr>
          </thead>
          <tbody>
            {enrollments?.map((e: any) => (
              <tr key={e.id} className="border-t border-border">
                <td className="p-3">{e.profiles?.full_name || e.profiles?.email}</td>
                <td className="p-3">{e.courses?.title}</td>
                <td className="p-3 text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => toggle(e.id, e.access_granted)}
                    className={`px-3 py-1 text-xs rounded font-semibold ${e.access_granted ? "bg-primary/15 text-primary" : "bg-coral/15 text-coral"}`}>
                    {e.access_granted ? "Granted" : "Revoked"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
