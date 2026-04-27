"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  onSignOut?: () => void;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
};

export default function Navbar({ onSignOut, showBack, backHref = "/", backLabel = "Interview Prep" }: Props) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Generator" },
    { href: "/history", label: "History" },
    { href: "/insights", label: "Insights" },
    { href: "/profile", label: "Profile" },
    { href: "/account", label: "Account" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#fafafa]/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        {showBack ? (
          <Link href={backHref} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            ← {backLabel}
          </Link>
        ) : (
          <Link href="/" className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors font-medium">
            Interview Prep
          </Link>
        )}

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors ml-2"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
