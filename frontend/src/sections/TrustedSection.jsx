import { organizations } from "../data/organizations";

export default function TrustedSection() {
  return (
    <section className="py-24 bg-slate-950">

      <div className="max-w-7xl mx-auto px-8">

        <p className="text-center text-slate-400 uppercase tracking-[8px] mb-12">
          Trusted Organizations
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

          {organizations.map((org) => (

            <div
              key={org.id}
              className="
              bg-slate-900/70
              backdrop-blur-xl
              border
              border-slate-800
              rounded-2xl
              p-6
              hover:border-cyan-500
              transition-all
              duration-300
              text-center
              "
            >
              <h3 className="text-white font-semibold">
                {org.name}
              </h3>

              <p className="text-slate-400 text-sm mt-2">
                {org.type}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}