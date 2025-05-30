import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!email || !password || !confirm) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    if (!isValidEmail(email)) {
      alert("유효한 이메일 형식을 입력해주세요. 예: user@example.com");
      return;
    }
    if (password !== confirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/auth/signup", {
        email,
        password,
      });
      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      alert("회원가입 실패: " + err.response?.data?.detail);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-[#f7f8fa]">
      <div className="w-full max-w-md">
        <Header title="회원가입" showBack onBack={() => navigate(-1)} />
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
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-[#FDA177] text-gray-600 placeholder-[#FDA177] py-2 px-4 rounded-md text-sm focus:outline-none focus:border-[#FDA177]"
          />
          <button
            onClick={handleSignup}
            className="w-full bg-[#FDA177] text-white py-2 rounded-full text-sm font-semibold"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
