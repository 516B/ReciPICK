import { Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header";

export default function CategoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

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

  const items = [
    {
      id: "6898082",
      name: "쌈무우말이",
      image:
        "https://recipe1.ezmember.co.kr/cache/recipe/2018/10/17/3d8f1b20aa4e3f8ecdcfb3fcb7d773f91.jpg",
    },
    {
      id: "6898083",
      name: "샐러드 파스타",
      image: "https://via.placeholder.com/400x300?text=샐러드파스타",
    },
    {
      id: "6898084",
      name: "단호박 샐러드",
      image: "https://via.placeholder.com/400x300?text=단호박샐러드",
    },
    {
      id: "6898085",
      name: "연어 샐러드",
      image: "https://via.placeholder.com/400x300?text=연어샐러드",
    },
    {
      id: "6898086",
      name: "닭가슴살 샐러드",
      image: "https://via.placeholder.com/400x300?text=닭가슴살샐러드",
    },
    {
      id: "6898087",
      name: "과일 샐러드",
      image: "https://via.placeholder.com/400x300?text=과일샐러드",
    },
    {
      id: "6898088",
      name: "리코타치즈 샐러드",
      image: "https://via.placeholder.com/400x300?text=리코타샐러드",
    },
    {
      id: "6898089",
      name: "두부 샐러드",
      image: "https://via.placeholder.com/400x300?text=두부샐러드",
    },
  ];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
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
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() =>
                  navigate(`/recipe/${item.id}`, {
                    state: { categoryName, categoryIcon },
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
