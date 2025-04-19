import { ArrowLeft, Clock, User, MessageSquare, List, Grid, Image } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export default function RecipePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryName = location.state?.categoryName || '';

  const recipe = {
    id: 1,
    name: '시금치나물',
    date: '2025.4.11',
    description: '비타민 풍부한 나물이요. 들기름 넣으면 더욱 맛있어요.',
    servings: 2,
    difficulty: '쉬움',
    image: 'https://via.placeholder.com/400x300',
    author: '반찬조아',
    ingredients: {
      main: [
        { name: '시금치', amount: '400g' },
        { name: '무', amount: '150g' },
      ],
      sauce: [
        { name: '참장', amount: '1~2 큰술' },
        { name: '다진마늘', amount: '3개' },
      ]
    },
    cookware: ['냄비', '믹싱볼', '주걱', '채반', '도마', '컨테이너', '접시'],
    steps: [
      {
        id: 1,
        text: '끓는 물에 시금치를 살짝 데친 후 찬물에 헹궈 물기를 짠다.',
        tools: ['냄비', '채반'],
        images: Array(3).fill('https://via.placeholder.com/100x80')
      },
      {
        id: 2,
        text: '시금치를 먹기 좋은 크기로 자른다.',
        tools: ['도마', '컨테이너'],
        images: Array(2).fill('https://via.placeholder.com/100x80')
      },
      {
        id: 3,
        text: '양념과 함께 무쳐 접시에 담는다.',
        tools: ['믹싱볼', '접시'],
        images: Array(2).fill('https://via.placeholder.com/100x80')
      },
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center">
      <div className="w-full max-w-md">
        <header className="bg-[#fef3e8] p-4 flex items-center justify-between border-b border-orange-200">
          <button onClick={() => navigate(`/category/${categoryName}`)} className="text-[#7a3e0d]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-md font-semibold text-[#7a3e0d]">{recipe.name}</h1>
          <div className="w-5" />
        </header>

        <div className="relative">
          <img src={recipe.image} alt={recipe.name} className="w-full h-52 object-cover" />
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/50 to-transparent p-4 flex items-center">
            <div className="w-8 h-8 rounded-full bg-white mr-2" />
            <span className="text-white text-sm">{recipe.author}</span>
          </div>
        </div>

        <div className="p-4 bg-white border-b border-gray-200">
          <h2 className="text-xl font-bold mb-2">{recipe.id}.{recipe.name}({recipe.date})</h2>
          <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>
          <div className="flex justify-around text-center text-gray-500 text-sm">
            <div className="flex flex-col items-center">
              <User size={18} />
              <span>{recipe.servings}인분</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock size={18} />
              <span>30분 이내</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageSquare size={18} />
              <span>난이도 {recipe.difficulty}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white mt-2 border-b border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-medium">재료 <span className="text-xs text-gray-500">Ingredients</span></h3>
          </div>

          <div>
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 text-gray-700">[재료]</h4>
              <div className="grid grid-cols-2 gap-y-3">
                {recipe.ingredients.main.map((ingredient, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-800">{ingredient.name}</span>
                    <span className="text-red-500">{ingredient.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium mb-2 text-gray-700">[양념]</h4>
              <div className="grid grid-cols-2 gap-y-3">
                {recipe.ingredients.sauce.map((ingredient, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-800">{ingredient.name}</span>
                    <span className="text-red-500">{ingredient.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium mb-2">조리도구</h4>
            <div className="grid grid-cols-2 gap-y-2">
              {recipe.cookware.map((item, idx) => (
                <div key={idx} className="text-gray-800">{item}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">조리순서 <span className="text-xs text-gray-500">Steps</span></h3>
            <div className="flex space-x-2">
              <button className="p-1 bg-gray-200 rounded">
                <Image size={16} />
              </button>
              <button className="p-1 bg-gray-200 rounded">
                <List size={16} />
              </button>
              <button className="p-1 bg-gray-200 rounded">
                <Grid size={16} />
              </button>
            </div>
          </div>

          {recipe.steps.map(step => (
            <div key={step.id} className="mb-6">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mr-3">
                  {step.id}
                </div>
                <p className="text-gray-800">{step.text}</p>
              </div>

              <div className="ml-11 mb-3">
                {step.tools.map((tool, idx) => (
                  <span key={idx} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                    {tool}
                  </span>
                ))}
              </div>

              <div className="ml-11 flex space-x-2 overflow-x-auto pb-2">
                {step.images.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img} 
                    alt={`Step ${step.id} image ${idx+1}`}
                    className="w-20 h-16 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
