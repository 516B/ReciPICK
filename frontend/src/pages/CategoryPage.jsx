import { Search, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import api from "../utils/api";

export default function CategoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const params = new URLSearchParams(location.search);
  const nameFromQuery = params.get("name");
  const decodedName = nameFromQuery ? decodeURIComponent(nameFromQuery) : "";
  const userId = localStorage.getItem("userId");

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
      const res = await api.get(
        `/category/search?name=${encodeURIComponent(decodedName)}&page=${pageNum}&per_page=8`
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
      //console.error("카테고리 불러오기 오류:", err);
    }
  };

  const fetchBookmarks = async () => {
    if (!userId) return;
    try {
      const res = await api.get("/bookmark/", {
        params: { user_id: userId },
      });
      setBookmarkedIds(res.data.recipe_ids.map(id => Number(id)));
    } catch (err) {
      //console.error("찜 목록 불러오기 실패:", err);
    }
  };

  const toggleBookmark = async (recipeId) => {
    if (!userId) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    const isBookmarked = bookmarkedIds.includes(Number(recipeId));
    try {
      if (isBookmarked) {
        await api.delete(`/bookmark/${recipeId}`, {
          params: { user_id: userId },
        });
        setBookmarkedIds((prev) => prev.filter((id) => id !== Number(recipeId)));
      } else {
        await api.post(`/bookmark/${recipeId}`, null, {
          params: { user_id: userId },
        });
        setBookmarkedIds((prev) => [...prev, Number(recipeId)]);
      }
    } catch (err) {
      //console.warn("찜 처리 에러:", err.response?.data?.detail);
    }
  };

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setHasMore(true);
    fetchRecipes(1);
  }, [decodedName]);

  useEffect(() => {
    fetchBookmarks();
  }, [userId]);

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

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredItems = recipes
    .filter(item =>
      item.title !== "정보 없음" &&
      item.image_url !== "정보 없음" &&
      item.image_url?.trim() !== ""
    )
    .filter(item =>
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
                  <div className="relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-36 object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(item.id);
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                    >
                      <Heart
                        size={20}
                        fill={bookmarkedIds.includes(Number(item.id)) ? "red" : "white"}
                        className={bookmarkedIds.includes(Number(item.id)) ? "text-red-500" : "text-gray-300"}
                      />
                    </button>
                  </div>
                  <div className="text-center text-sm text-gray-700 py-2 px-2">
                    {item.title}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-2 text-center text-sm text-gray-400">
              로딩중 ...
            </p>
          )}
        </div>


        {showTopBtn && (
          <>
            {/*PC용 버튼 */}
            <button
              onClick={scrollToTop}
              className="hidden md:fixed md:bottom-20 md:bg-[#FDA177] md:text-white md:rounded-full md:w-12 md:h-12 md:flex md:items-center md:justify-center md:shadow-lg md:z-50 md:transition md:hover:bg-[#fc5305]"
              style={{ right: 'calc(50% - 250px)' }}
              aria-label="맨 위로 (PC)"
            >
              <span style={{ fontSize: "2rem", lineHeight: "2rem" }}>↑</span>
            </button>

            {/*모바일용 버튼 */}
            <button
              onClick={scrollToTop}
              className="fixed bottom-20 right-4 bg-[#FDA177] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg z-50 transition hover:bg-[#fc5305] md:hidden"
              aria-label="맨 위로 (모바일)"
            >
              <span style={{ fontSize: "2rem", lineHeight: "2rem" }}>↑</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
