import { Link } from "react-router-dom";

export interface NavLink {
  to: string;
  label: string;
}

interface NavItemProps extends NavLink {
  active: boolean;
  block?: boolean;
}

export function NavItem({ to, label, active, block }: NavItemProps) {
  const base = "text-sm font-medium transition-colors duration-150";
  const state = active ? "text-primary" : "text-muted-foreground hover:text-foreground";
  const blockClass = block ? "block rounded-md px-3 py-2.5 hover:bg-secondary" : "";
  return (
    <Link to={to} className={`${base} ${state} ${blockClass}`}>
      {label}
    </Link>
  );
}
