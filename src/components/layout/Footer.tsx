import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Platform", href: "#features" },
    { label: "Pricing", href: "#solutions" },
    { label: "API", href: "#contact" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Resources: [
    { label: "Blog", href: "#" },
    { label: "Support", href: "#contact" },
    { label: "Security", href: "#faq" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4 text-slate-600">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90 text-base font-bold tracking-tight text-white shadow-lg shadow-emerald-500/40">
                P
              </span>
              <span>Parkit</span>
            </div>
            <p className="max-w-sm text-sm">
              Discover welcoming places to park, charge, and host—powered by
              neighbours and city partners in more than 180 destinations.
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Parkit Mobility Inc. All rights
              reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm text-slate-500 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="space-y-3">
                <h4 className="font-semibold text-slate-900">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition hover:text-slate-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
