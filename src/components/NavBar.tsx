import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const linkBase =
  "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground";

export const NavBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-card-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <nav className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="text-base font-semibold text-foreground">Candidate Suite</div>
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                linkBase,
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-surface-hover"
              )
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/manage"
            className={({ isActive }) =>
              cn(
                linkBase,
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-surface-hover"
              )
            }
          >
            Manage Candidates
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
