import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { inputCls } from "@/components/AuthShell";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
  }, [profile]);

  const { data: enrolled } = useQuery({
    queryKey: ["my-courses-profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("enrollments").select("courses(id,title)").eq("user_id", user!.id)).data || [],
  });

  const save = async () => {
    const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refreshProfile();
  };

  const changePw = async () => {
    if (pw.length < 6) return toast.error("Min 6 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated"); setPw("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 space-y-4">
          <div><label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
            <input className={inputCls + " mt-1 opacity-60"} disabled value={profile?.email || ""} /></div>
          <div><label className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</label>
            <input className={inputCls + " mt-1"} placeholder="Add your full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="text-xs uppercase tracking-widest text-muted-foreground">Phone</label>
            <input className={inputCls + " mt-1"} placeholder="Add your phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <button onClick={save} className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold teal-glow-hover">Save changes</button>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Change Password</h2>
          <div className="mt-3 flex gap-2">
            <input type="password" className={inputCls} placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} />
            <button onClick={changePw} className="px-4 py-2 rounded-md bg-coral text-white font-semibold whitespace-nowrap">Update</button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-3">Enrolled Courses</h2>
          {enrolled?.length ? (
            <ul className="space-y-2">
              {enrolled.map((e: any) => (
                <li key={e.courses.id}><Link to="/my-course/$id" params={{ id: e.courses.id }} className="text-primary hover:underline text-sm">{e.courses.title}</Link></li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No enrollments yet.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
