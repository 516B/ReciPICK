import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ title = "레시픽", showBack = false, onBack, onLogoClick }) {
  const navigate = useNavigate();

  return (
    <header className="bg-[#ffe2d9] h-16 px-4 text-center relative flex items-center justify-center">
      {showBack && (
        <button
          onClick={onBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a3e0d]"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      {typeof title === "string" ? (
        <h1 className="text-xl font-bold text-[#000000]">{title}</h1>
      ) : (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => {
            if (onLogoClick) onLogoClick();
            else navigate("/");
          }}
        >
          {title}
        </div>
      )}
    </header>
  );
}
