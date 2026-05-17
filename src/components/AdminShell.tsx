import { Link, Outlet } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Users, BookOpen, GraduationCap, Megaphone, LayoutDashboard } from "lucide-react";

export function AdminShell() {
  const links = [
    { to: "/admin", label: "Overview", Icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", Icon: Users },
    { to: "/admin/courses", label: "Courses", Icon: BookOpen },
    { to: "/admin/enrollments", label: "Enrollments", Icon: GraduationCap },
    { to: "/admin/announcements", label: "Announcements", Icon: Megaphone },
  ];
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="rounded-xl border border-border bg-card p-3 h-fit">
          {links.map(({ to, label, Icon }) => (
            <Link key={to} to={to as any} activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary/15 text-primary" }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-background/40">
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
