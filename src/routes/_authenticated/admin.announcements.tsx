import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/announcements")({ component: AdminAnnouncements });

function AdminAnnouncements() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", message: "", course_id: "" });
  const { data: courses } = useQuery({
    queryKey: ["c-list"], queryFn: async () => (await supabase.from("courses").select("id,title")).data || [],
  });
  const { data: list } = useQuery({
    queryKey: ["all-anns"],
    queryFn: async () => (await supabase.from("announcements").select("*, courses(title)").order("created_at", { ascending: false })).data || [],
  });
  const submit = async () => {
    if (!f.title || !f.message) return toast.error("Required");
    const { error } = await supabase.from("announcements").insert({
      title: f.title, message: f.message,
      course_id: f.course_id || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Announcement posted"); setF({ title: "", message: "", course_id: "" });
    qc.invalidateQueries({ queryKey: ["all-anns"] });
  };
  const del = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-anns"] });
  };
  const cls = "w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm";
  return (
    <div>
      <h1 className="text-2xl font-bold">Announcements</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">New Announcement</h2>
        <input className={cls} placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <textarea className={cls + " min-h-[100px]"} placeholder="Message" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
        <select className={cls} value={f.course_id} onChange={e => setF({ ...f, course_id: e.target.value })}>
          <option value="">All students (global)</option>
          {courses?.map(c => <option key={c.id} value={c.id}>{c.title} students only</option>)}
        </select>
        <button onClick={submit} className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm">Post</button>
      </div>

      <h2 className="mt-8 font-semibold">Past Announcements</h2>
      <div className="mt-3 space-y-2">
        {list?.map((a: any) => (
          <div key={a.id} className="rounded-lg border border-border bg-card p-4 flex justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm">{a.title}
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  · {a.courses?.title || "All students"} · {new Date(a.created_at).toLocaleDateString()}
                </span>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
            </div>
            <button onClick={() => del(a.id)} className="text-coral shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
