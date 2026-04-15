import { Link, Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { to: "/rapport", label: "Rapport" },
  { to: "/laaneberegner", label: "Lån" },
  { to: "/omgivelser", label: "Omgivelser" },
  { to: "/budget", label: "Budget" },
  { to: "/tjekliste", label: "Tjekliste" },
  { to: "/omkostninger", label: "Omkostninger" },
] as const;

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Spring til indhold
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <nav aria-label="Hovednavigation" className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="text-xl font-semibold text-primary" aria-label="HusKlar — Til forsiden">
            HusKlar
          </Link>
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors duration-150 ${
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
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
