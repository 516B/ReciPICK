import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

const foodCategories = [
  { name: '밑반찬', icon: '🍱' },
  { name: '메인반찬', icon: '🍲' },
  { name: '국/탕', icon: '🥣' },
  { name: '찌개', icon: '🍜' },
  { name: '양식', icon: '🍝' },
  { name: '디저트', icon: '🧁' },
  { name: '퓨전', icon: '🥘' },
  { name: '빵', icon: '🍞' },
  { name: '밥/죽/떡', icon: '🍚' },
  { name: '샐러드', icon: '🥗' },
];

export default function CategoryPage() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [decodedName, setDecodedName] = useState('');
  const [currentCategory, setCurrentCategory] = useState(null);

  useEffect(() => {
    if (name) {
      const decoded = decodeURIComponent(name);
      setDecodedName(decoded);

      const category = foodCategories.find(cat => cat.name === decoded);
      setCurrentCategory(category);
    } else {
      setDecodedName('');
      setCurrentCategory(null);
    }
  }, [name]);

  const [searchText, setSearchText] = useState('');
  const [items] = useState([
    { id: 1, name: '시금치나물', image: 'https://via.placeholder.com/400x300' },
    { id: 2, name: '김치', image: 'https://via.placeholder.com/400x300' },
    { id: 3, name: '무생채', image: 'https://via.placeholder.com/400x300' },
    { id: 4, name: '오이무침', image: 'https://via.placeholder.com/400x300' },
    { id: 5, name: '콩나물무침', image: 'https://via.placeholder.com/400x300' },
    { id: 6, name: '마늘쫑볶음', image: 'https://via.placeholder.com/400x300' },
  ]);

  const filteredItems = useMemo(
    () =>
      items.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      ),
    [searchText, items]
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex justify-center">
      <div className="w-full max-w-md flex flex-col">
        {/* Header */}
        <header className="bg-[#fef3e8] p-4 flex items-center justify-between border-b border-orange-200">
          <button onClick={() => navigate('/')} className="text-[#7a3e0d]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-md font-semibold text-[#7a3e0d]">
            {currentCategory ? `${currentCategory.icon} ${currentCategory.name}` : '카테고리'}
          </h1>
          <div className="w-5" />
        </header>

        {/* Search Input */}
        <div className="bg-white p-4 border-b border-orange-100">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="레시피 이름 검색..."
              className="w-full p-2 pl-10 border border-orange-200 rounded-lg bg-gray-50 text-sm text-gray-800"
            />
            <Search className="absolute left-3 top-2.5 text-orange-400" size={18} />
          </div>
        </div>

        {/* Filtered Grid */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/recipe/${item.id}`, {
                  state: { categoryName: decodedName } 
                })}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-36 object-cover"
                />
                <div className="text-center text-sm text-gray-700 py-2">{item.name}</div>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
