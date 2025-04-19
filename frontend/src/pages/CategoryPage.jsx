import { Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header";

export default function CategoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  // 쿼리 파라미터에서 categoryName 읽기
  const params = new URLSearchParams(location.search);
  const nameFromQuery = params.get("name");
  const decodedName = nameFromQuery ? decodeURIComponent(nameFromQuery) : "";

  // 아이콘 매핑
  const categoryIconMap = {
    "밑반찬": "🍱",
    "메인반찬": "🍲",
    "국/탕": "🥣",
    "찌개": "🍜",
    "양식": "🍝",
    "디저트": "🧁",
    "퓨전": "🥘",
    "빵": "🍞",
    "밥/죽/떡": "🍚",
    "샐러드": "🥗",
  };

  const categoryName = decodedName;
  const categoryIcon =
    location.state?.categoryIcon || categoryIconMap[categoryName] || "🍽️";

  const categoryTitle = `${categoryIcon} ${categoryName}`;

  const items = [
    { id: 1, name: "시금치나물", image: "https://via.placeholder.com/400x300" },
    { id: 2, name: "김치", image: "https://via.placeholder.com/400x300" },
    { id: 3, name: "무생채", image: "https://via.placeholder.com/400x300" },
    { id: 4, name: "오이무침", image: "https://via.placeholder.com/400x300" },
    { id: 5, name: "콩나물무침", image: "https://via.placeholder.com/400x300" },
    { id: 6, name: "마늘쫑볶음", image: "https://via.placeholder.com/400x300" },
  ];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        {/*  헤더 */}
        <Header title={categoryTitle} showBack onBack={() => navigate("/")} />

        {/* 검색창 */}
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
        
        {/*  레시피 목록 */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() =>
                  navigate(`/recipe/${item.id}`, {
                    state: {
                      categoryName: categoryName,
                      categoryIcon: categoryIcon, 
                    },
                  })
                }
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-36 object-cover"
                />
                <div className="text-center text-sm text-gray-700 py-2">
                  {item.name}
                </div>
              </div>
            ))
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
