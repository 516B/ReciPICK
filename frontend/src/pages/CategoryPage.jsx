import { Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import axios from "axios";

export default function CategoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const params = new URLSearchParams(location.search);
  const nameFromQuery = params.get("name");
  const decodedName = nameFromQuery ? decodeURIComponent(nameFromQuery) : "";

  const categoryIconMap = {
    "밥/죽/떡": "🍚",
    "국/탕": "🫕",
    "찌개": "🍲",
    "밑반찬": "🥢",
    "메인반찬": "🥣",
    "양식": "🍝",
    "빵": "🥖",
    "디저트": "🧁",
    "퓨전": "🥘",
    "샐러드": "🥗",
  };

  const categoryName = decodedName;
  const categoryIcon =
    location.state?.categoryIcon || categoryIconMap[categoryName] || "🍽️";
  const categoryTitle = `${categoryIcon} ${categoryName}`;

  const fetchRecipes = async (pageNum = 1) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/search/category?name=${encodeURIComponent(decodedName)}&page=${pageNum}&per_page=8`
      );
      const newRecipes = res.data.recipes || [];

      setRecipes((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const filtered = newRecipes.filter((r) => !seen.has(r.id));
        return [...prev, ...filtered];
      });

      if (newRecipes.length === 0 || newRecipes.every(r => recipes.some(e => e.id === r.id))) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("카테고리 불러오기 오류:", err);
    }
  };

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setHasMore(true);
    fetchRecipes(1);
  }, [decodedName]);

  const observer = useRef();
  const lastItemRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchRecipes(next);
            return next;
          });
        }
      });

      if (node) observer.current.observe(node);
    },
    [hasMore]
  );

  const filteredItems = recipes.filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        <Header title={categoryTitle} showBack onBack={() => navigate("/")} />

        <div className="bg-white p-4">
          <div className="relative flex items-center border border-[#fc5305] rounded-full bg-[#ffffff] px-4 py-2">
            <Search className="text-[#fc5305] mr-2" size={20} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="레시피 검색"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isLast = index === filteredItems.length - 1;
              return (
                <div
                  key={item.id}
                  ref={isLast ? lastItemRef : null}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() =>
                    navigate(`/recipe/${item.id}`, {
                      state: { categoryName, categoryIcon },
                    })
                  }
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-36 object-cover"
                  />
                  <div className="text-center text-sm text-gray-700 py-2">
                    {item.title}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-2 text-center text-sm text-gray-400">
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
