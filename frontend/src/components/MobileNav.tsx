import { useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NavItem, type NavLink } from "./NavItem";
import { CloseIcon, MenuIcon } from "./icons";

interface MobileNavProps {
  links: readonly NavLink[];
  currentPath: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function MobileNav({ links, currentPath, isOpen, onToggle, onClose }: MobileNavProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? "Luk menu" : "Åbn menu"}
          className="flex h-11 w-11 items-center justify-center rounded-md text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!isOpen}
        className="absolute inset-x-0 top-full border-t border-border bg-background shadow-md md:hidden"
      >
        <ul className="mx-auto flex max-w-screen-xl flex-col gap-1 px-4 py-3">
          {links.map((link) => (
            <li key={link.to}>
              <NavItem to={link.to} label={link.label} active={currentPath === link.to} block />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
