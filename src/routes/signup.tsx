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
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name,
          phone: form.phone,
          preferred_course_id: form.preferred_course_id || null,
        },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    if (data.user) {
      await supabase.from("registrations").insert({
        user_id: data.user.id,
        course_id: form.preferred_course_id || null,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      });
    }

    // Auto-enroll into preferred course if selected and session exists
    if (form.preferred_course_id && data.user) {
      await supabase.from("enrollments").insert({
        user_id: data.user.id,
        course_id: form.preferred_course_id,
        access_granted: true,
      });
    }
    setLoading(false);
    toast.success("Account created! Welcome to MedElectra.");
    if (form.preferred_course_id) {
      navigate({ to: "/my-course/$id", params: { id: form.preferred_course_id } });
    } else {
      navigate({ to: "/dashboard" });
    }
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
