import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SEASONINGS = [
  "소금", "설탕", "간장", "식초", "후추", "고춧가루", "고추장", "된장", "참기름", "들기름",
  "물엿", "맛술", "청주", "케첩", "마요네즈", "쌈장", "양조간장", "진간장", "미림"
];

export default function MyPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [topIngredients, setTopIngredients] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userId);
    if (userId) {
      const storedRecipes = localStorage.getItem(`recentViews_${userId}`);
      if (storedRecipes) {
        const parsed = JSON.parse(storedRecipes);
        setRecentRecipes(parsed);

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
          .slice(0, 6)
          .map(([name]) => name);

        setTopIngredients(sorted);
      } else {
        setRecentRecipes([]);
        setTopIngredients([]);
      }
    } else {
      setRecentRecipes([]);
      setTopIngredients([]);
    }
  }, [isLoggedIn]);

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
          <div className="p-6 flex flex-col gap-4">
            {recentRecipes.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-2">최근 본 레시피</h3>
                <div className="grid grid-cols-2 gap-4">
                  {recentRecipes.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/recipe/${item.id}`)}
                      className="cursor-pointer"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <div className="text-sm text-gray-700 mt-1 text-center">
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topIngredients.length > 0 && (
              <div className="mt-6"> 
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
