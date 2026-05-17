import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, inputCls, btnPrimary } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword(form);
    if (error) { setLoading(false); return toast.error(error.message); }
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    toast.success("Welcome back!");
    navigate({ to: prof?.role === "admin" ? "/admin" : "/dashboard" });
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue"
      footer={<>New here? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <input className={inputCls} placeholder="Email" type="email" required value={form.email}
               onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className={inputCls} placeholder="Password" type="password" required value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className={btnPrimary}>{loading ? "Signing in..." : "Log In"}</button>
      </form>
    </AuthShell>
  );
}
