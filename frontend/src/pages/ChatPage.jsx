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

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      type: "text",
      content: "나만의 레시피를 검색해보세요!",
      time: getCurrentTime(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);
  const hasInitialized = useRef(false); 

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  useEffect(() => {
    if (passedRecipe && !hasInitialized.current) {
      hasInitialized.current = true; 
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
    }
  }, []);

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
      const res = await axios.get(
        `http://localhost:8000/search?ingredient=${encodeURIComponent(userText)}`
      );
      const recipes = res.data.recipes || [];

      const botMessage = {
        id: messages.length + 2,
        sender: "bot",
        type: recipes.length > 0 ? "list" : "text",
        content:
          recipes.length > 0
            ? recipes
            : `"${userText}"에 해당하는 레시피를 찾지 못했어요.`,
        time: getCurrentTime(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("검색 에러:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "알 수 없는 오류가 발생했어요.";

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "bot",
          type: "text",
          content: `레시피 검색 중 오류가 발생했어요.\n${errorMsg}`,
          time: getCurrentTime(),
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
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

                  {msg.type === "list" && (
                    <ul className="list-disc list-inside space-y-1">
                      {msg.content.map((recipe) => (
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
