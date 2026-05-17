import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { naira } from "@/lib/format";
import { Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses")({ component: AdminCourses });

function AdminCourses() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("*").order("created_at")).data || [],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Courses</h1>
      <div className="mt-6 space-y-3">
        {courses?.map(c => (
          <div key={c.id} className="rounded-xl border border-border bg-card">
            <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="w-full p-4 flex items-center justify-between text-left">
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-xs text-muted-foreground">{naira(c.price)}</p>
              </div>
              {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded === c.id && (
              <div className="px-4 pb-5 space-y-6 border-t border-border pt-5">
                <CourseEditor course={c} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-courses"] })} />
                <VideoManager courseId={c.id} />
                <ResourceManager courseId={c.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseEditor({ course, onSaved }: { course: any; onSaved: () => void }) {
  const [f, setF] = useState({ title: course.title, description: course.description, price: course.price, thumbnail_url: course.thumbnail_url || "", intro_video_url: course.intro_video_url || "" });
  const save = async () => {
    const { error } = await supabase.from("courses").update(f).eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success("Course updated"); onSaved();
  };
  const cls = "w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm";
  return (
    <div className="space-y-3">
      <input className={cls} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <textarea className={cls + " min-h-[100px]"} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <div className="grid sm:grid-cols-3 gap-3">
        <input className={cls} type="number" value={f.price} onChange={e => setF({ ...f, price: Number(e.target.value) })} placeholder="Price ₦" />
        <input className={cls} value={f.thumbnail_url} onChange={e => setF({ ...f, thumbnail_url: e.target.value })} placeholder="Thumbnail URL" />
        <input className={cls} value={f.intro_video_url} onChange={e => setF({ ...f, intro_video_url: e.target.value })} placeholder="Intro Video URL" />
      </div>
      <button onClick={save} className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm">Save Course</button>
    </div>
  );
}

function VideoManager({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const { data: videos } = useQuery({
    queryKey: ["admin-videos", courseId],
    queryFn: async () => (await supabase.from("course_videos").select("*").eq("course_id", courseId).order("order_index")).data || [],
  });
  const [n, setN] = useState({ title: "", video_url: "", description: "" });
  const add = async () => {
    if (!n.title || !n.video_url) return toast.error("Title and URL required");
    const order = (videos?.length || 0) + 1;
    const { error } = await supabase.from("course_videos").insert({ course_id: courseId, ...n, order_index: order });
    if (error) return toast.error(error.message);
    toast.success("Video added"); setN({ title: "", video_url: "", description: "" });
    qc.invalidateQueries({ queryKey: ["admin-videos", courseId] });
  };
  const del = async (id: string) => {
    await supabase.from("course_videos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-videos", courseId] });
  };
  const move = async (id: string, dir: -1 | 1) => {
    const list = [...(videos || [])];
    const i = list.findIndex(v => v.id === id);
    const j = i + dir; if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    await Promise.all([
      supabase.from("course_videos").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("course_videos").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin-videos", courseId] });
  };
  const cls = "w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm";
  return (
    <div>
      <h4 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-3">Videos</h4>
      <div className="space-y-2">
        {videos?.map(v => (
          <div key={v.id} className="flex items-center gap-2 p-3 rounded-md bg-background/30 border border-border">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(v.id, -1)}><ChevronUp className="w-3 h-3" /></button>
              <button onClick={() => move(v.id, 1)}><ChevronDown className="w-3 h-3" /></button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{v.title}</p>
              <p className="text-xs text-muted-foreground truncate">{v.video_url}</p>
            </div>
            <button onClick={() => del(v.id)} className="text-coral"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 grid sm:grid-cols-3 gap-2">
        <input className={cls} placeholder="Title" value={n.title} onChange={e => setN({ ...n, title: e.target.value })} />
        <input className={cls} placeholder="YouTube / Video URL" value={n.video_url} onChange={e => setN({ ...n, video_url: e.target.value })} />
        <input className={cls} placeholder="Description (opt)" value={n.description} onChange={e => setN({ ...n, description: e.target.value })} />
      </div>
      <button onClick={add} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
        <Plus className="w-3.5 h-3.5" /> Add Video
      </button>
    </div>
  );
}

function ResourceManager({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const { data: res } = useQuery({
    queryKey: ["admin-resources", courseId],
    queryFn: async () => (await supabase.from("course_resources").select("*").eq("course_id", courseId)).data || [],
  });
  const [n, setN] = useState({ title: "", file_url: "" });
  const add = async () => {
    if (!n.title || !n.file_url) return toast.error("Required");
    const { error } = await supabase.from("course_resources").insert({ course_id: courseId, ...n });
    if (error) return toast.error(error.message);
    toast.success("Resource added"); setN({ title: "", file_url: "" });
    qc.invalidateQueries({ queryKey: ["admin-resources", courseId] });
  };
  const del = async (id: string) => {
    await supabase.from("course_resources").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-resources", courseId] });
  };
  const cls = "w-full px-3 py-2 rounded-md bg-input/40 border border-border text-sm";
  return (
    <div>
      <h4 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-3">Resources</h4>
      <div className="space-y-2">
        {res?.map(r => (
          <div key={r.id} className="flex items-center gap-2 p-3 rounded-md bg-background/30 border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{r.file_url}</p>
            </div>
            <button onClick={() => del(r.id)} className="text-coral"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        <input className={cls} placeholder="Title" value={n.title} onChange={e => setN({ ...n, title: e.target.value })} />
        <input className={cls} placeholder="File URL" value={n.file_url} onChange={e => setN({ ...n, file_url: e.target.value })} />
      </div>
      <button onClick={add} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
        <Plus className="w-3.5 h-3.5" /> Add Resource
      </button>
    </div>
  );
}
