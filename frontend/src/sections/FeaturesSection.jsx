import { features } from "../data/features";
import Card from "../components/ui/Card";

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-8">

        <div className="text-center mb-16">
          <p className="text-cyan-400 uppercase tracking-[6px]">
            Platform Features
          </p>

          <h2 className="text-5xl font-bold text-white mt-4">
            Why Choose Our Platform?
          </h2>

          <p className="text-slate-400 mt-6 max-w-2xl mx-auto">
            Everything you need to discover, analyze and manage tenders from one premium AI-powered platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.id}>
              <div className="text-5xl mb-6">{feature.icon}</div>

              <h3 className="text-2xl font-bold text-white">
                {feature.title}
              </h3>

              <p className="text-slate-400 mt-4 leading-7">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}