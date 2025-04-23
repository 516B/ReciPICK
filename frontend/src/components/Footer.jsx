import { Heart, Home, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <footer className="w-full bg-[#FDA177] text-white flex justify-around items-center py-3">
      <button
        onClick={() => navigate("/bookmarks")}
        className={`flex flex-col items-center text-xs ${isActive("/bookmarks") ? "opacity-100" : "opacity-90"}`}
      >
        <Heart size={20} />
        <span>찜</span>
      </button>

      <button
        onClick={() => navigate("/")}
        className={`flex flex-col items-center text-xs ${isActive("/") ? "opacity-100" : "opacity-90"}`}
      >
        <Home size={20} />
        <span>홈</span>
      </button>

      <button
        onClick={() => navigate("/mypage")}
        className={`flex flex-col items-center text-xs ${isActive("/mypage") ? "opacity-100" : "opacity-90"}`}
      >
        <User size={20} />
        <span>마이</span>
      </button>
    </footer>
  );
}
