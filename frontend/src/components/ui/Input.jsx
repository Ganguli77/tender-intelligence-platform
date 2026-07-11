export default function Input({
  ...props
}) {
  return (
    <input
      {...props}
      className="
      w-full
      rounded-xl
      bg-slate-900
      border
      border-slate-700
      px-5
      py-4
      text-white
      outline-none
      focus:border-cyan-400
      transition
      "
    />
  );
}