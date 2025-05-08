import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

export default function MainPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const observer = useRef();

  const foodCategories = [
    { name: "밥/죽/떡", icon: "🍚" },
    { name: "국/탕", icon: "🫕" },
    { name: "찌개", icon: "🍲" },
    { name: "밑반찬", icon: "🥢" },
    { name: "메인반찬", icon: "🥣" },
    { name: "양식", icon: "🍝" },
    { name: "빵", icon: "🥖" },
    { name: "디저트", icon: "🧁" },
    { name: "퓨전", icon: "🥘" },
    { name: "샐러드", icon: "🥗" },
  ];

  useEffect(() => {
    setSearchResults([]);
    setPage(1);
  }, [searchText]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchText.trim()) return;

      try {
        const res = await axios.get(
          `http://localhost:8000/search/title?q=${encodeURIComponent(searchText)}&page=${page}&per_page=8`
        );

        const newResults = res.data.recipes || [];

        setSearchResults((prev) => {
          if (page === 1) {
            setHasMore(newResults.length > 0);
            return newResults;
          }

          const seen = new Set(prev.map((r) => r.id));
          const filtered = newResults.filter((r) => !seen.has(r.id));
          setHasMore(filtered.length > 0);
          return [...prev, ...filtered];
        });
      } catch (err) {
        console.error("검색 오류:", err);
        setHasMore(false);
      }
    };

    fetchResults();
  }, [searchText, page]);

  const lastResultRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [hasMore]
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-[#F7F8FA]">
        <div className="relative w-full max-w-md mx-auto bg-[#F7F8FA] text-sm">
          <Header
            title={
              <img
                src="/images/mainlogo.png"
                alt="레시픽 로고"
                className="h-12 object-contain"
              />
            }
            onLogoClick={() => {
              setSearchText("");
              setSearchResults([]);
              setPage(1);
            }}
          />

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

          {searchText.trim() !== "" ? (
            <div className="p-4 grid grid-cols-2 gap-4">
              {searchResults.map((recipe, idx) => (
                <div
                  key={recipe.id}
                  ref={idx === searchResults.length - 1 ? lastResultRef : null}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-36 object-cover"
                  />
                  <div className="text-center text-sm text-gray-700 py-2">
                    {recipe.title}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-x-4 gap-y-5 place-items-center">
                {foodCategories.map((category, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      navigate(`/category?name=${encodeURIComponent(category.name)}`, {
                        state: {
                          categoryName: category.name,
                          categoryIcon: category.icon,
                        },
                      })
                    }
                    className="w-full max-w-[100px] h-[100px] bg-[#ffe2d9] hover:bg-[#FFCBB3] transition-all rounded-2xl shadow-sm flex flex-col items-center justify-center"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-xs mt-1 font-medium text-black">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        {searchText.trim() === "" && (
          <div
            onClick={() => navigate("/chat")}
             className="absolute bottom-4 right-4 w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform z-50"
          >
            <img
              src="/images/chat.png"
              alt="챗봇"
              className="w-24 h-24 object-contain"
            />
          </div>
        )}
          </div> 
      </main>
      <Footer />
    </div>
  );
}
