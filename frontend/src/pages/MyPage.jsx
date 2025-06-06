import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SEASONINGS = [
  "소금", "설탕", "간장", "식초", "후추", "고춧가루", "고추장", "된장", "참기름", "들기름",
  "물엿", "맛술", "청주", "케첩", "마요네즈", "쌈장", "양조간장", "진간장", "미림"
];

export default function MyPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [topIngredients, setTopIngredients] = useState([]);
  const [gptRecommendations, setGptRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [cacheKey, setCacheKey] = useState("");
  const [userId, setUserId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setIsLoggedIn(!!id);
    setUserId(id);
    if (!id) {
      setRecentRecipes([]);
      setTopIngredients([]);
      setGptRecommendations([]);
      setCacheKey("");
      return;
    }

    const storedRecipes = localStorage.getItem(`recentViews_${id}`);
    let parsed = [];
    if (storedRecipes) {
      parsed = JSON.parse(storedRecipes);
      setRecentRecipes(parsed);
    }

    const ingredients = parsed.flatMap(r => r.ingredients || []);
    const nameCounts = {};
    ingredients.forEach((item) => {
      const name = item.split(":")[0].trim();
      if (name && !SEASONINGS.includes(name)) {
        nameCounts[name] = (nameCounts[name] || 0) + 1;
      }
    });
    const sorted = Object.entries(nameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
    setTopIngredients(sorted);

    const recentForPrompt = parsed.map(r => ({
      id: r.id,
      title: r.title,
      ingredients: (r.ingredients || [])
        .map(i => i.split(":")[0].trim())
        .filter(name => name && !SEASONINGS.includes(name))
    }));
    const key = JSON.stringify(recentForPrompt);
    setCacheKey(key);
  }, []);

  const fetchGptRecommend = async (recentList, bookmarked, key, userId) => {
    try {
      const res = await axios.post("http://localhost:8000/gpt/custom", {
        recent_recipes: recentList,
        bookmarked_recipe_ids: bookmarked.map(r => r.id),
      });
      const result = res.data.recipes || [];
      localStorage.setItem(`customGptRecommendations_${userId}`, JSON.stringify(result));
      localStorage.setItem(`customGptRecommendationsKey_${userId}`, key);
      localStorage.setItem(`customGptCacheTime_${userId}`, Date.now().toString());
      setGptRecommendations(result);
      setIsLoading(false);
    } catch (err) {
      setGptRecommendations([]);
      setIsLoading(false);
    }
  };

  const handleGptClick = () => {
    if (isLoading || hasRequested || !userId) return;
    setHasRequested(true);

    const recKey = `customGptRecommendations_${userId}`;
    const recCacheKey = `customGptRecommendationsKey_${userId}`;
    const recCacheTime = `customGptCacheTime_${userId}`;

    const lastKey = localStorage.getItem(recCacheKey);
    const lastTime = Number(localStorage.getItem(recCacheTime));
    const now = Date.now();
    const isFresh = now - lastTime < 1000 * 60 * 60 * 6;

    if (lastKey === cacheKey && isFresh) {
      setGptRecommendations(JSON.parse(localStorage.getItem(recKey) || "[]"));
      return;
    }

    setIsLoading(true);
    const recentForPrompt = recentRecipes.map(r => ({
      id: r.id,
      title: r.title,
      ingredients: (r.ingredients || [])
        .map(i => i.split(":")[0].trim())
        .filter(name => name && !SEASONINGS.includes(name))
    }));
    fetchGptRecommend(recentForPrompt, [], cacheKey, userId);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    alert("로그아웃 되었습니다.");
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 2 + recentRecipes.length) % recentRecipes.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 2) % recentRecipes.length);
  };

  const visibleRecent = recentRecipes.slice(currentIndex, currentIndex + 2);

  return (
    <div className="flex flex-col min-h-screen items-center bg-[#f7f8fa]">
      <div className="w-full max-w-md flex-grow">
        <Header title="마이페이지" showBack onBack={() => navigate(-1)} />
        {isLoggedIn ? (
          <div className="p-6 flex flex-col gap-4">
            {topIngredients.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-2">자주 쓴 재료</h3>
                <div className="flex flex-wrap gap-2">
                  {topIngredients.map((name, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full border border-orange-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recentRecipes.length > 0 && (
              <div className="mt-3">
                <h3 className="text-base font-semibold mb-2">최근 본 레시피</h3>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrev}><ChevronLeft size={20} /></button>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {visibleRecent.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/recipe/${item.id}`)}
                        className="cursor-pointer"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <div className="text-sm text-gray-800 text-center font-semibold h-[36px] leading-tight px-2 overflow-hidden text-ellipsis line-clamp-2">
  {item.title}
</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleNext}><ChevronRight size={20} /></button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3
                onClick={handleGptClick}
                className="text-base font-bold mb-3 cursor-pointer hover:underline"
              >
                이런 레시피는 어떠세요?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {isLoading ? (
                  <div className="col-span-2 text-sm text-gray-400">레시피 서치 중...</div>
                ) : gptRecommendations.length === 0 ? (
                  <div className="col-span-2 text-sm text-gray-400">클릭을 통해 AI 추천을 확인해보세요.</div>
                ) : (
                  gptRecommendations.slice(0, 6).map((rec) => (
                   <div
  key={rec.id}
  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow hover:shadow-md transition cursor-pointer flex flex-col"
  onClick={() => navigate(`/recipe/${rec.id}`)}
>
  <img src={rec.image_url} alt={rec.title} className="w-full h-24 object-cover" />
  
  <div className="text-xs text-gray-700 font-bold px-2 pt-2 text-left leading-snug line-clamp-2 min-h-[2.75rem]">
  {rec.title}
</div>
  <div className="text-[11px] text-gray-700 px-2 py-2 text-left leading-relaxed bg-[#ffe2d9] flex-grow">
    {rec.reason}
  </div>
</div>
                  ))
                )}
              </div>
            </div>
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
      {isLoggedIn && (
        <button
          onClick={handleLogout}
          className="text-xs text-red-400 underline my-4 self-center"
        >
          로그아웃
        </button>
      )}
      <Footer />
    </div>
  );
}
