import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer"; 

export default function MyPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 페이지 들어오자마자 로그인 상태 확인
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userId); // 문자열이 존재하면 true
    console.log("로그인 상태:", !!userId);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    alert("로그아웃 되었습니다.");
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-[#f7f8fa]">
      <div className="w-full max-w-md flex-grow">
        <Header title="마이페이지" showBack onBack={() => navigate(-1)} />

        {isLoggedIn ? (
          <div className="p-6 mt-20 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">안녕하세요!</h2>
            <p className="text-sm text-gray-600">마이페이지 입니다.</p>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 underline"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="p-6 mt-24 flex flex-col items-center gap-8">
            <button
              onClick={() => navigate("/login")}
              className="w-full border border-[#FDA177] text-[#FDA177] py-2 rounded-full text-sm font-semibold"
            >
              로그인
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="w-full bg-[#FDA177] text-white py-2 rounded-full text-sm font-semibold"
            >
              회원가입
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
