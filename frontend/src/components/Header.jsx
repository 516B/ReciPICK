import { ArrowLeft } from "lucide-react";

export default function Header({ title = "레시픽", showBack = false, onBack }) {
  return (
    <header className="bg-[#ffe2d9] p-4 text-center relative">
      {showBack && (
        <button
          onClick={onBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a3e0d]"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="text-xl font-bold text-[#000000]">{title}</h1>
    </header>
  );
}
