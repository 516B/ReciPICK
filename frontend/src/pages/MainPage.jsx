import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainPage() {
  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-[#F7F8FA]">
        <div className="w-full max-w-md mx-auto bg-[#F7F8FA] text-sm">
        <Header
          title={
            <img
              src="/images/mainlogo.png"
              alt="레시픽 로고"
              className="h-12 object-contain"
            />
          }
        />
          <div className="bg-white p-4">
            <div
              className="relative flex items-center border border-[#fc5305] rounded-full bg-[#ffffff] px-4 py-2"
              onClick={() => navigate("/chat")}
            >
              <Search className="text-[#fc5305] mr-2" size={20} />
              <span className="text-gray-400 text-sm">나만의 레시피 검색</span>
            </div>
          </div>

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
              {foodCategories.length % 3 !== 0 && <div className="invisible" />}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
