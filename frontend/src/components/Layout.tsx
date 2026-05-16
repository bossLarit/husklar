import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { NavItem, type NavLink } from "./NavItem";

const navLinks: readonly NavLink[] = [
  { to: "/rapport", label: "Rapport" },
  { to: "/laaneberegner", label: "Lån" },
  { to: "/omgivelser", label: "Omgivelser" },
  { to: "/budget", label: "Budget" },
  { to: "/tjekliste", label: "Tjekliste" },
  { to: "/omkostninger", label: "Omkostninger" },
];

export function Layout() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Spring til indhold
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <nav
          aria-label="Hovednavigation"
          className="relative mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 md:px-6"
        >
          <Link to="/" className="text-xl font-semibold text-primary" aria-label="HusKlar — Til forsiden">
            HusKlar
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} active={location.pathname === link.to} />
            ))}
            <ThemeToggle />
          </div>

          <MobileNav
            links={navLinks}
            currentPath={location.pathname}
            isOpen={isOpen}
            onToggle={() => setIsOpen((v) => !v)}
            onClose={() => setIsOpen(false)}
          />
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-screen-xl px-4 py-8 md:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>HusKlar — Din guide til boligkøb</p>
      </footer>
    </div>
  );
}
