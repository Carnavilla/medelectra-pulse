import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, inputCls, btnPrimary } from "@/components/AuthShell";

type SignupSearch = { course?: string };

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  validateSearch: (s: Record<string, unknown>): SignupSearch => ({
    course: typeof s.course === "string" ? s.course : undefined,
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { course: preselected } = Route.useSearch();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", confirm: "",
    preferred_course_id: "",
  });
  const [loading, setLoading] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["courses-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id,title").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (preselected) setForm(f => ({ ...f, preferred_course_id: preselected }));
  }, [preselected]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const courseId = form.preferred_course_id || null;
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name,
          phone: form.phone,
          preferred_course_id: courseId,
        },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    const userId = data.user?.id;
    // If we already have a session (auto-confirm on), persist registration + enrollment.
    // The DB trigger handle_new_user() also covers this server-side.
    if (data.session && userId) {
      await supabase.from("registrations").insert({
        user_id: userId,
        course_id: courseId,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      });
      if (courseId) {
        await supabase.from("enrollments").upsert(
          { user_id: userId, course_id: courseId, access_granted: true },
          { onConflict: "user_id,course_id" },
        );
      }
    }
    // Mark this email as a fresh signup so the dashboard greets with "Welcome,"
    try { sessionStorage.setItem("medelectra-new-signup", form.email.toLowerCase()); } catch {}
    // Always send new users to the login page to authenticate explicitly.
    if (data.session) {
      await supabase.auth.signOut();
    }
    setLoading(false);
    toast.success("Account created! Please log in to continue.");
    navigate({ to: "/login" });
  };

  return (
    <AuthShell title="Create your account" subtitle="Join MedElectra Institute"
      footer={<>Already have one? <Link to="/login" className="text-primary hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <input className={inputCls} placeholder="Full Name" required value={form.full_name}
               onChange={e => setForm({ ...form, full_name: e.target.value })} />
        <input className={inputCls} placeholder="Email" type="email" required value={form.email}
               onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className={inputCls} placeholder="Phone Number" required value={form.phone}
               onChange={e => setForm({ ...form, phone: e.target.value })} />
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            Preferred Course
          </label>
          <select
            className={inputCls}
            value={form.preferred_course_id}
            onChange={e => setForm({ ...form, preferred_course_id: e.target.value })}
          >
            <option value="">— Select a course (optional) —</option>
            {courses?.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <input className={inputCls} placeholder="Password" type="password" required value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })} />
        <input className={inputCls} placeholder="Confirm Password" type="password" required value={form.confirm}
               onChange={e => setForm({ ...form, confirm: e.target.value })} />
        <button disabled={loading} className={btnPrimary}>{loading ? "Creating..." : "Sign Up"}</button>
      </form>
    </AuthShell>
  );
}
