import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (!isValidEmail(email)) {
      alert("유효한 이메일 형식을 입력해주세요. 예: user@example.com");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/auth/login", {
        email,
        password,
      });
      localStorage.setItem("userId", res.data.userId);
      alert("로그인에 성공하였습니다!");
      navigate("/");
    } catch (err) {
      alert("로그인 실패: " + err.response?.data?.detail);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-[#f7f8fa]">
      <div className="w-full max-w-md">
        <Header title="로그인" showBack onBack={() => navigate(-1)} />
        <div className="p-6 mt-20 flex flex-col gap-6 items-center">
          <input
            type="text"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#FDA177] text-gray-600 placeholder-[#FDA177] py-2 px-4 rounded-md text-sm focus:outline-none focus:border-[#FDA177]"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#FDA177] text-gray-600 placeholder-[#FDA177] py-2 px-4 rounded-md text-sm focus:outline-none focus:border-[#FDA177]"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-[#FDA177] text-white py-2 rounded-full text-sm font-semibold"
          >
            로그인
          </button>
          <div className="mt-2 text-xs text-gray-500">
            계정이 없으신가요?{" "}
            <span
              className="text-[#FDA177] underline cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              회원가입
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
