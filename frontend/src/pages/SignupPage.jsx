import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen items-center bg-[#f7f8fa]">
      <div className="w-full max-w-md">
        <Header title="회원가입" showBack onBack={() => navigate(-1)} />
        <div className="p-6 mt-20 flex flex-col gap-6 items-center">
          <input
            type="text"
            placeholder="이메일"
            className="w-full border border-[#FDA177] text-gray-600 placeholder-[#FDA177] py-2 px-4 rounded-md text-sm focus:outline-none focus:border-[#FDA177]"
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full border border-[#FDA177] text-gray-600 placeholder-[#FDA177] py-2 px-4 rounded-md text-sm focus:outline-none focus:border-[#FDA177]"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="w-full border border-[#FDA177] text-gray-600 placeholder-[#FDA177] py-2 px-4 rounded-md text-sm focus:outline-none focus:border-[#FDA177]"
          />
          <button className="w-full bg-[#FDA177] text-white py-2 rounded-full text-sm font-semibold">
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
