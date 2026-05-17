import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, inputCls, btnPrimary } from "@/components/AuthShell";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: form.full_name, phone: form.phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Welcome to MedElectra.");
    navigate({ to: "/dashboard" });
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
        <input className={inputCls} placeholder="Password" type="password" required value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })} />
        <input className={inputCls} placeholder="Confirm Password" type="password" required value={form.confirm}
               onChange={e => setForm({ ...form, confirm: e.target.value })} />
        <button disabled={loading} className={btnPrimary}>{loading ? "Creating..." : "Sign Up"}</button>
      </form>
    </AuthShell>
  );
}
