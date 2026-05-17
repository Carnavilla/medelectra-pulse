import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Spinner } from "@/components/Spinner";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

function AdminLayout() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") navigate({ to: "/dashboard" });
  }, [profile, loading, navigate]);
  if (loading || !profile) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (profile.role !== "admin") return null;
  return <AdminShell />;
}
