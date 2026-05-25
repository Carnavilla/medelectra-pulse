import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Megaphone,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const NAV = [
  { to: "/admin",               label: "Overview",       icon: LayoutDashboard, exact: true },
  { to: "/admin/users",         label: "Students",       icon: Users },
  { to: "/admin/enrollments",   label: "Enrollments",    icon: GraduationCap },
  { to: "/admin/courses",       label: "Courses",        icon: BookOpen },
  { to: "/admin/announcements", label: "Announcements",  icon: Megaphone },
];

export function AdminShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight tracking-wide">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground leading-tight">MedElectra Institute</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2.5">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.full_name ?? "Admin"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-md border border-border hover:border-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Student view
            </Link>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="inline-flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-md border border-border hover:border-coral hover:text-coral transition-colors"
            >
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
