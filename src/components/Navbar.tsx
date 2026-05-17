import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <>
      <Link to="/courses" className="hover:text-primary transition-colors">Courses</Link>
      {user && <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>}
      {profile?.role === "admin" && <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">{navLinks}</nav>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={toggle} aria-label="Toggle theme"
            className="p-2 rounded-md hover:bg-card transition">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              <Link to="/profile" className="text-sm hover:text-primary">{profile?.full_name?.split(" ")[0] || "Profile"}</Link>
              <button onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:border-coral hover:text-coral transition">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:text-primary">Login</Link>
              <Link to="/signup"
                className="text-sm font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground teal-glow-hover">
                Sign Up
              </Link>
            </>
          )}
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-4 text-sm">
          {navLinks}
          <button onClick={toggle} className="flex items-center gap-2 text-left">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Theme
          </button>
          {user ? (
            <>
              <Link to="/profile">Profile</Link>
              <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="text-left text-coral">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup" className="text-primary font-semibold">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
