import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8000/auth/login", null, {
        params: {
          email,
          password,
        },
      });

      localStorage.setItem("userId", res.data.userId);
      alert("로그인 성공!");
      navigate("/mypage");
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
        </div>
      </div>
    </div>
  );
}
