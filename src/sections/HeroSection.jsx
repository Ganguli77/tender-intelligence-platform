import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 blur-[140px] rounded-full"></div>

      <div className="absolute bottom-20 right-20 w-[450px] h-[450px] bg-blue-700/20 blur-[160px] rounded-full"></div>

      <div className="max-w-7xl mx-auto w-full px-8 relative z-10">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}

          <div>

            <span className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium">

              🚀 AI Powered Platform

            </span>

            <h1 className="mt-8 text-6xl lg:text-7xl font-extrabold leading-tight text-white">

              Discover

              <span className="text-cyan-400">

                {" "}Government{" "}

              </span>

              & Private Tenders Smarter

            </h1>

            <p className="mt-8 text-slate-300 text-xl leading-9 max-w-xl">

              Find opportunities faster, analyze tenders with AI,
              manage bids efficiently, and never miss important deadlines.

            </p>

            <div className="flex gap-5 mt-10">

              <Button to="/tenders">

                Explore Tenders →

              </Button>

              <Button variant="secondary" to="/add-tender">

                Add Tender

              </Button>

            </div>

            <div className="flex gap-10 mt-14">

              <div>

                <h2 className="text-4xl font-bold text-cyan-400">

                  10K+

                </h2>

                <p className="text-slate-400">

                  Live Tenders

                </p>

              </div>

              <div>

                <h2 className="text-4xl font-bold text-cyan-400">

                  500+

                </h2>

                <p className="text-slate-400">

                  Organizations

                </p>

              </div>

              <div>

                <h2 className="text-4xl font-bold text-cyan-400">

                  AI

                </h2>

                <p className="text-slate-400">

                  Smart Insights

                </p>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div>

            <Card>

              <div className="space-y-6">

                <h2 className="text-2xl font-bold text-white">

                  AI Dashboard

                </h2>

                <div className="bg-slate-800 rounded-2xl p-5">

                  📊 Live Tenders

                  <div className="mt-3 h-3 rounded-full bg-cyan-500 w-4/5"></div>

                </div>

                <div className="bg-slate-800 rounded-2xl p-5">

                  🤖 AI Recommendation

                  <div className="mt-3 h-3 rounded-full bg-green-500 w-3/5"></div>

                </div>

                <div className="bg-slate-800 rounded-2xl p-5">

                  📈 Analytics

                  <div className="mt-3 h-3 rounded-full bg-purple-500 w-2/3"></div>

                </div>

                <div className="bg-slate-800 rounded-2xl p-5">

                  🔔 Deadline Alerts

                  <div className="mt-3 h-3 rounded-full bg-orange-500 w-5/6"></div>

                </div>

              </div>

            </Card>

          </div>

        </div>

      </div>

    </section>
  );
}