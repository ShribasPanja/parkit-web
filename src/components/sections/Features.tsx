import { features } from "@/data/features";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative isolate overflow-hidden bg-white py-24 sm:py-32"
    >
      <div
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-50 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="space-y-16">
          <SectionHeading
            eyebrow="The Parkit way"
            title="Feel at home whether you are driving or hosting."
            description="We borrow the best parts of Airbnb—welcoming hosts, trusted reviews, easy payments—and tailor them for parking and charging."
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
