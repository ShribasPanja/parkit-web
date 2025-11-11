import { testimonials } from "@/data/testimonials";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/ui/TestimonialCard";

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative isolate overflow-hidden bg-slate-50 py-24 sm:py-32"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Loved by our community"
          title="Guests and hosts rate Parkit 4.8 out of 5."
          description="Stories from neighbours, EV owners, and courier teams who rely on Parkit to keep journeys effortless."
          align="center"
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
