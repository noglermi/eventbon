import Link from "next/link";

type LegalPageProps = {
  title: string;
  intro: string;
  sections: Array<{
    title: string;
    items: string[];
  }>;
};

const organizerResponsibilityItems = [
  "uploaded images",
  "product information",
  "prices",
  "allergen information",
];

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f6f7f5] px-6 py-8 text-slate-950">
      <div className="mx-auto grid max-w-3xl gap-6">
        <header className="border-b border-slate-200 pb-6">
          <Link href="/" className="text-2xl font-black tracking-normal text-emerald-600">
            eventBon
          </Link>
          <p className="mt-3 text-sm font-black uppercase tracking-widest text-amber-700">Windows Pilot</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600">{intro}</p>
        </header>

        <section className="rounded-lg bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-950 ring-1 ring-amber-200">
          <p className="font-black">Placeholder content for closed pilot preparation.</p>
          <p className="mt-2">Final legal review is required before public production launch.</p>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-black tracking-tight">Organizer responsibility</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Organizers are responsible for the following event content:
          </p>
          <ul className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
            {organizerResponsibilityItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-slate-700">
              {section.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="flex flex-wrap gap-3 border-t border-slate-200 pt-5 text-sm font-bold text-slate-600">
          <Link href="/" className="text-emerald-700 hover:text-emerald-900">Organizer login</Link>
          <Link href="/support" className="text-emerald-700 hover:text-emerald-900">Support / Problem melden</Link>
        </footer>
      </div>
    </main>
  );
}
