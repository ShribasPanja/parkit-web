import { faqs } from "@/data/faqs";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FAQSection() {
  return (
    <section
      id="faq"
      className="relative isolate overflow-hidden bg-white py-24 sm:py-32"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(52,211,153,0.18),_transparent_55%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions from guests and hosts."
          description="Whether you are planning a visit, hosting your driveway, or managing a fleet, we are here to help."
          align="center"
        />
        <div className="mt-16 space-y-6">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-emerald-200 hover:shadow-emerald-100"
            >
              <summary className="cursor-pointer select-none list-none px-6 py-5 text-lg font-medium text-slate-900">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-sm leading-relaxed text-slate-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
