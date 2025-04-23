import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Clock, User, Star } from "lucide-react";
import Header from "../components/Header";

// 난이도에 따른 별 개수 반환 함수
function getStarsByDifficulty(difficulty) {
  switch (difficulty) {
    case "아무나":
    case "초급":
      return 1;
    case "중급":
      return 2;
    case "고급":
      return 3;
    default:
      return 0;
  }
}

const dummyRecipes = [
  {
    id: "6898082",
    title: "쌈무우말이",
    category: "샐러드",
    serving: "4인분",
    cook_time: "30분 이내",
    difficulty: "초급",
    image_url:
      "https://recipe1.ezmember.co.kr/cache/recipe/2018/10/17/3d8f1b20aa4e3f8ecdcfb3fcb7d773f91.jpg",
    ingredients: [
      "파프리카 노란색: 1/2개",
      "파프리카 빨간색: 1/2개",
      "크래미: 6개",
      "계란: 4개",
      "팽이버섯: 1/2봉지",
      "쌈무우물: 10숟가락",
      "연겨자: 2숟가락",
      "꿀: 1숟가락",
      "마늘다진거: 1숟가락",
      "깨소금: 1숟가락",
      "소금: 1티스푼",
    ],
    steps: [
      "야채는 너무 굵지 않고 길이가 비슷하게 썰어 주세요.",
      "계란에 소금 한꼬집 넣고 풀어서 2개씩 나누어 계란말이를 해주세요.",
      "쌈무 끝부분에 여러 재료를 올리고 부채꼴 모양으로 돌돌 말아주세요.",
      "소스 만들기: 쌈무우물10수저 + 겨자2 + 꿀1 + 마늘1 + 깨소금1 + 소금1티스푼 잘 저어주세요.",
    ],
  },
];

export default function RecipePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const categoryName = location.state?.categoryName || "";
  const categoryIcon = location.state?.categoryIcon || "🍽️";

  const recipe = dummyRecipes.find((r) => r.id === id);
  if (!recipe) return <div className="p-4">레시피를 찾을 수 없습니다.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center">
      <div className="w-full max-w-md">

        {/* Header */}
        <Header
          title={
            <img
              src="/images/mainlogo.png"
              alt="레시픽 로고"
              className="h-12 object-contain"
            />
          }
          showBack
          onBack={() =>
            navigate(`/category?name=${encodeURIComponent(categoryName)}`, {
              state: { categoryName, categoryIcon },
            })
          }
        />

        {/* 레시피 이미지 */}
        <div className="relative">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-52 object-cover"
          />
        </div>

        {/* 제목 + Chat 버튼 */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{recipe.title}</h2>
            <button
              onClick={() => navigate("/chat")}
              className="text-xs bg-[#2DB431] text-white font-semibold px-3 py-1 rounded-full shadow hover:bg-[#1e7f22] transition"
            >
              💬 Chat
            </button>
          </div>

          {/* 인분 / 시간 / 난이도 */}
          <div className="flex justify-center text-center text-gray-500 text-sm px-4">
            <div className="flex gap-12">
              <div className="flex flex-col items-center">
                <User size={18} />
                <span className="mt-1">{recipe.serving}</span>
              </div>
              <div className="flex flex-col items-center">
                <Clock size={18} />
                <span className="mt-1">{recipe.cook_time}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex gap-1">
                  {Array.from({ length: getStarsByDifficulty(recipe.difficulty) }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        size={18}
                        strokeWidth={2}
                        className="text-gray-600"
                        fill="currentColor"
                      />
                    )
                  )}
                </div>
                <span className="mt-1 text-sm text-gray-500">
                  난이도 {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 재료 목록 */}
        <div className="p-4 bg-white mt-2 border-b border-gray-200">
          <h3 className="text-lg font-bold mb-4">재료</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {recipe.ingredients.map((item, idx) => {
              const [name, amount] = item.split(":");
              return (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-800">{name.trim()}</span>
                  <span className="text-[#18881C] font-medium">
                    {amount?.trim()}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 조리 순서 */}
        <div className="p-4 bg-white mt-2">
          <h3 className="text-lg font-bold mb-4">조리순서</h3>
          {recipe.steps.map((step, idx) => (
            <div key={idx} className="mb-6">
              <div className="flex items-start mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2DB431] text-white text-sm font-bold mr-3">
                  {idx + 1}
                </div>
                <p className="text-gray-800 text-sm leading-relaxed flex-1">
                  {step}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
