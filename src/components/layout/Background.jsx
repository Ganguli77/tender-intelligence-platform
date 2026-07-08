export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">

      <div className="absolute top-20 left-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl"></div>

      <div className="absolute bottom-20 right-20 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl"></div>

      <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl"></div>

    </div>
  );
}