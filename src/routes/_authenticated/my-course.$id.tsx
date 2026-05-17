import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/Spinner";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Download, Megaphone, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-course/$id")({ component: MyCourse });

function ytEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function MyCourse() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"video" | "resources" | "announcements">("video");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ["access", id, user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("enrollments")
        .select("access_granted").eq("course_id", id).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!accessLoading && (!access || !access.access_granted)) {
      toast.error("You don't have access to this course");
      navigate({ to: "/dashboard" });
    }
  }, [access, accessLoading, navigate]);

  const { data: course } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await supabase.from("courses").select("*").eq("id", id).single()).data,
  });

  const { data: videos } = useQuery({
    queryKey: ["videos", id], enabled: !!access?.access_granted,
    queryFn: async () => {
      const { data } = await supabase.from("course_videos").select("*").eq("course_id", id).order("order_index");
      return data || [];
    },
  });

  const { data: resources } = useQuery({
    queryKey: ["resources", id], enabled: !!access?.access_granted,
    queryFn: async () => (await supabase.from("course_resources").select("*").eq("course_id", id)).data || [],
  });

  const { data: announcements } = useQuery({
    queryKey: ["course-anns", id], enabled: !!access?.access_granted,
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*")
        .or(`course_id.eq.${id},course_id.is.null`).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", id, user?.id], enabled: !!user && !!access?.access_granted,
    queryFn: async () => {
      const { data } = await supabase.from("progress").select("*")
        .eq("user_id", user!.id).eq("course_id", id);
      return data || [];
    },
  });

  useEffect(() => {
    if (videos && videos.length && !activeVideo) setActiveVideo(videos[0].id);
  }, [videos, activeVideo]);

  const watched = new Set((progress || []).filter((p: any) => p.watched).map((p: any) => p.video_id));
  const pct = videos?.length ? Math.round(watched.size / videos.length * 100) : 0;
  const current = videos?.find(v => v.id === activeVideo);

  const markWatched = async () => {
    if (!current || !user) return;
    const { error } = await supabase.from("progress")
      .upsert({ user_id: user.id, video_id: current.id, course_id: id, watched: true, watched_at: new Date().toISOString() },
              { onConflict: "user_id,video_id" });
    if (error) return toast.error(error.message);
    toast.success("Marked as watched");
    qc.invalidateQueries({ queryKey: ["progress", id, user.id] });
  };

  if (accessLoading) return <div className="min-h-screen"><Navbar /><Spinner /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <p className="text-xs uppercase tracking-widest text-primary">My Course</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{course?.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <div className="flex-1 h-1.5 rounded-full bg-card overflow-hidden max-w-md">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-primary font-semibold">{pct}% complete</span>
        </div>

        <div className="mt-6 grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="rounded-xl border border-border bg-card p-3 h-fit">
            <h3 className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground">Lessons</h3>
            {!videos?.length && <p className="p-3 text-sm text-muted-foreground">No videos yet.</p>}
            <ul className="space-y-1">
              {videos?.map((v, i) => (
                <li key={v.id}>
                  <button onClick={() => { setActiveVideo(v.id); setTab("video"); }}
                    className={`w-full text-left flex items-start gap-2 p-2 rounded-md text-sm transition ${
                      activeVideo === v.id ? "bg-primary/15 text-primary" : "hover:bg-background/40"}`}>
                    {watched.has(v.id) ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" /> :
                      <Circle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />}
                    <span className="leading-snug"><span className="opacity-60 mr-1">{i + 1}.</span>{v.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <section className="space-y-4">
            <div className="flex gap-2 border-b border-border">
              {[["video","Video"],["resources","Resources"],["announcements","Announcements"]].map(([k,label]) => (
                <button key={k} onClick={() => setTab(k as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                    tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>{label}</button>
              ))}
            </div>

            {tab === "video" && (
              current ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black">
                    <iframe src={ytEmbed(current.video_url)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                  </div>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-xl font-semibold">{current.title}</h2>
                      {current.description && <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>}
                    </div>
                    <button onClick={markWatched} disabled={watched.has(current.id)}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover disabled:opacity-50">
                      {watched.has(current.id) ? "Watched ✓" : "Mark as Watched"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                  <PlayCircle className="w-10 h-10 mx-auto mb-3 text-primary" />
                  Lessons will appear here once the instructor adds them.
                </div>
              )
            )}

            {tab === "resources" && (
              <div className="space-y-2">
                {resources?.length ? resources.map(r => (
                  <a key={r.id} href={r.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary transition">
                    <span className="text-sm">{r.title}</span>
                    <Download className="w-4 h-4 text-primary" />
                  </a>
                )) : <p className="text-sm text-muted-foreground">No resources yet.</p>}
              </div>
            )}

            {tab === "announcements" && (
              <div className="space-y-3">
                {announcements?.length ? announcements.map(a => (
                  <div key={a.id} className="rounded-lg border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Megaphone className="w-3.5 h-3.5 text-coral" />{a.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No announcements yet.</p>}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
