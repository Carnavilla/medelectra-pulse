import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: enrolls } = await supabase.from("enrollments").select("user_id");
      const counts: Record<string, number> = {};
      (enrolls || []).forEach((e: any) => { counts[e.user_id] = (counts[e.user_id] || 0) + 1; });
      return (profs || []).map((p: any) => ({ ...p, enrolled: counts[p.id] || 0 }));
    },
  });

  const toggleRole = async (uid: string, current: string) => {
    if (uid === user?.id) return toast.error("You cannot change your own role");
    const newRole = current === "admin" ? "user" : "admin";
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", uid);
    if (error) return toast.error(error.message);
    toast.success(`Updated to ${newRole}`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const filtered = data?.filter(u =>
    !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <input className="mt-4 w-full max-w-sm px-3 py-2 rounded-md bg-input/40 border border-border text-sm"
             placeholder="Search by name or email" value={q} onChange={e => setQ(e.target.value)} />
      <div className="mt-4 rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-background/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3">Courses</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {filtered?.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">{u.full_name || "—"}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                <td className="p-3"><span className={u.role === "admin" ? "text-coral font-semibold" : "text-primary"}>{u.role}</span></td>
                <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3">{u.enrolled}</td>
                <td className="p-3">
                  <button onClick={() => toggleRole(u.id, u.role)} disabled={u.id === user?.id}
                    className="px-3 py-1 text-xs rounded border border-border hover:border-primary disabled:opacity-30">
                    {u.role === "admin" ? "Demote" : "Promote to admin"}
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
