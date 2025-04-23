import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Clock, User, Star } from "lucide-react";
import Header from "../components/Header";
import axios from "axios";

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

export default function RecipePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const categoryName = location.state?.categoryName || "";
  const categoryIcon = location.state?.categoryIcon || "🍽️";

  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/recipe/${id}`);
        setRecipe(res.data);
      } catch (err) {
        setError("레시피를 불러오는 데 실패했습니다.");
        console.error(err);
      }
    };
    fetchRecipe();
  }, [id]);

  if (error) return <div className="p-4">{error}</div>;
  if (!recipe) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center">
      <div className="w-full max-w-md">
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

        <div className="relative">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-52 object-cover"
          />
        </div>

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
