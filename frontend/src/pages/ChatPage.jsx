import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Header from "../components/Header";
import axios from "axios";

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedRecipe = location.state?.recipe;

  const storedRecipe = localStorage.getItem("recipeForChat");
  const recipeData = passedRecipe || (storedRecipe && JSON.parse(storedRecipe));

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getCurrentDateTime = () =>
    new Date().toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

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
  const chatEndRef = useRef(null);
  const hasPostedIntro = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // ✅ 안내 메시지 중복 방지
  useEffect(() => {
    if (passedRecipe) {
      localStorage.setItem("recipeForChat", JSON.stringify(passedRecipe));
    }

    if (recipeData && !hasPostedIntro.current) {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) =>
            m.type === "text" &&
            m.content.startsWith(`"${recipeData.title}" 레시피에 대해 더 알고 싶으신가요?`)
        );

        if (!alreadyExists) {
          hasPostedIntro.current = true;

          setTimeout(() => {
            navigate(location.pathname, { replace: true });
          }, 0);

          return [
            ...prev,
            {
              id: prev.length + 1,
              sender: "bot",
              type: "text",
              content: `"${recipeData.title}" 레시피에 대해 더 알고 싶으신가요?\n재료: ${recipeData.ingredients?.join(", ")}`,
              time: getCurrentTime(),
            },
          ];
        }

        return prev;
      });
    }
  }, [passedRecipe, recipeData, navigate, location.pathname]);

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
      const servingMatch = userText.match(/(\d+)\s*인분/);

      if (servingMatch && recipeData) {
        const targetServing = `${servingMatch[1]}인분`;

        const res = await axios.post("http://localhost:8000/gpt/servings", {
          ingredients: recipeData.ingredients,
          steps: recipeData.steps,
          current_serving: recipeData.serving,
          target_serving: targetServing,
        });

        const converted = res.data.result;

        const notifyMessage = {
          id: messages.length + 2,
          sender: "bot",
          type: "text",
          content: `${targetServing} 기준으로 레시피를 변경했어요!`,
          time: getCurrentTime(),
        };

        const cardMessage = {
          id: messages.length + 3,
          sender: "bot",
          type: "servingsCard",
          content: {
            title: converted.title,
            serving: converted.serving,
            ingredients: converted.ingredients,
            steps: converted.steps,
          },
          time: getCurrentTime(),
        };

        setMessages((prev) => [...prev, notifyMessage, cardMessage]);
        return;
      }

      const res = await axios.post("http://localhost:8000/gpt/recommend", {
        message: userText,
        previous_ingredients: [],
        offset: 0,
      });

      const recipeList = res.data.recipes;

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
          id: messages.length + 2,
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

  // ✅ 대화 초기화 시 안내 메시지 원인인 recipeForChat 도 제거
  const clearMessages = () => {
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("recipeForChat"); // 🧹 여기 추가됨

    setMessages([
      {
        id: 1,
        sender: "bot",
        type: "text",
        content: "나만의 레시피를 검색해보세요!",
        time: getCurrentTime(),
      },
    ]);

    hasPostedIntro.current = false;
  };

  const displayTimestamp = getCurrentDateTime();

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] items-center">
      <div className="w-full max-w-md flex flex-col flex-1">
        <Header
          title="나만의 레시피 검색"
          showBack
          onBack={() => navigate(-1)}
        />

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="text-center text-xs text-gray-400 my-2">
            {displayTimestamp}
          </div>

          {messages.map((msg) => (
            <div key={msg.id}>
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
                {msg.type !== "servingsCard" ? (
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
                ) : (
                  <div
                    onClick={() =>
                      navigate(`/recipe/${recipeData.id}`, {
                        state: {
                          adjusted: true,
                          adjustedIngredients: msg.content.ingredients,
                          adjustedSteps: msg.content.steps,
                          adjustedServing: msg.content.serving,
                        },
                      })
                    }
                    className="bg-[#FBF5EF] cursor-pointer hover:shadow-md transition p-4 rounded-xl text-sm space-y-2 text-gray-800 max-w-[90%]"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-base font-semibold text-gray-900">
                        {msg.content.title}
                      </div>
                      <div className="text-xs text-[#18881C] font-medium">
                        {msg.content.serving}
                      </div>
                    </div>
                  </div>
                )}
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
