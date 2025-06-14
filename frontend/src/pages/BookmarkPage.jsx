import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BookmarkPage() {
  const [recipes, setRecipes] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }
    const fetchBookmarkedRecipes = async () => {
      try {
        const res = await axios.get("http://localhost:8000/bookmark/", {
          params: { user_id: userId },
        });
        const ids = res.data.recipe_ids;
        const recipePromises = ids.map((id) =>
          axios.get(`http://localhost:8000/recipe/${id}`).then((r) => r.data)
        );
        const recipeResults = await Promise.all(recipePromises);
        setRecipes(recipeResults);
      } catch (err) {
        //console.error("찜한 레시피 불러오기 실패:", err);
      }
    };
    fetchBookmarkedRecipes();
  }, [userId, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-[#F7F8FA]">
        <div className="w-full max-w-md mx-auto text-sm">
          <Header title="찜한 레시피" />
          <div className="p-4 flex flex-col gap-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex items-center"
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              >
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-20 h-20 object-cover flex-shrink-0 ml-2"
                />
                <div className="flex flex-col justify-center flex-1 px-3 py-2">
                  <div className="text-sm font-normal text-gray-800">{recipe.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
