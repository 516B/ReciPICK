import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Header from "../components/Header";
import axios from "axios";

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedRecipe = location.state?.recipe;

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const savedMessages = localStorage.getItem("chatMessages");

  const [messages, setMessages] = useState(
    savedMessages
      ? JSON.parse(savedMessages)
      : [
          {
            id: 1,
            sender: "bot",
            type: "text",
            content: "나만의 레시피를 검색해보세요!",
            time: getCurrentTime(),
          },
        ]
  );
  const [inputText, setInputText] = useState("");
  const [lastIngredients, setLastIngredients] = useState([]);
  const [offset, setOffset] = useState(0);
  const chatEndRef = useRef(null);
  const hasPostedIntro = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // 자동 메시지 1회 출력 후 state 제거
  useEffect(() => {
    if (passedRecipe && !hasPostedIntro.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "bot",
          type: "text",
          content: `"${passedRecipe.title}" 레시피에 대해 더 알고 싶으신가요?\n재료: ${passedRecipe.ingredients?.join(", ")}`,
          time: getCurrentTime(),
        },
      ]);
      hasPostedIntro.current = true;

      // 👉 뒤로 가기 시 recipe 정보가 다시 들어오지 않도록 제거
      navigate(location.pathname, { replace: true });
    }
  }, [passedRecipe, navigate, location.pathname]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();

    const newMessage = {
      id: messages.length + 1,
      sender: "user",
      type: "text",
      content: userText,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    try {
      const isRetryRequest = /다시\s*추천|다른\s*레시피/.test(userText);

      const res = await axios.post("http://localhost:8000/gpt/recommend", {
        message: userText,
        previous_ingredients: lastIngredients,
        offset: isRetryRequest ? offset : 0,
      });

      const recipeList = res.data.recipes;
      const newIngredients = res.data.ingredients;
      const newOffset = res.data.offset;

      if (!isRetryRequest) {
        setLastIngredients(newIngredients);
        setOffset(newOffset);
      } else {
        setOffset(newOffset);
      }

      const botMessage = {
        id: messages.length + 2,
        sender: "bot",
        type: recipeList.length > 0 ? "recommendation" : "text",
        content:
          recipeList.length > 0
            ? { recipes: recipeList }
            : "추천 결과가 없어요.",
        time: getCurrentTime(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "bot",
          type: "text",
          content: `오류 발생: ${errorMsg}`,
          time: getCurrentTime(),
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const clearMessages = () => {
    localStorage.removeItem("chatMessages");
    setMessages([
      {
        id: 1,
        sender: "bot",
        type: "text",
        content: "나만의 레시피를 검색해보세요!",
        time: getCurrentTime(),
      },
    ]);
    setLastIngredients([]);
    setOffset(0);
    hasPostedIntro.current = false;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] items-center">
      <div className="w-full max-w-md flex flex-col flex-1">
        <Header
          title="나만의 레시피 검색"
          showBack
          onBack={() => navigate(-1)}
        />

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="text-center text-xs text-gray-400">{msg.time}</div>
              <div
                className={`flex items-start ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                } mt-1`}
              >
                {msg.sender === "bot" && (
                  <img
                    src="/images/chatbot.png"
                    alt="Bot"
                    className="w-12 h-12 rounded-full mr-2"
                  />
                )}
                <div
                  className={`px-4 py-2 text-sm rounded-xl max-w-[75%] whitespace-pre-wrap ${
                    msg.sender === "bot"
                      ? "bg-[#ffcb8c] text-[#7a3e0d] rounded-tl-none mt-1.5"
                      : "bg-[#FBF5EF] text-gray-800 rounded-tr-none"
                  }`}
                >
                  {msg.type === "text" &&
                    msg.content.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}

                  {msg.type === "recommendation" && (
                    <ul className="list-disc list-inside space-y-1">
                      {msg.content.recipes.map((recipe) => (
                        <li key={recipe.id}>
                          <Link
                            to={`/recipe/${recipe.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {recipe.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <button
          onClick={clearMessages}
          className="text-xs text-gray-500 underline mt-2 mb-2 self-center"
        >
          대화 초기화
        </button>

        <div className="p-3 border-t bg-white flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-[#fce1c8] text-[#7a3e0d] rounded-full hover:bg-[#ffcb8c]"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
