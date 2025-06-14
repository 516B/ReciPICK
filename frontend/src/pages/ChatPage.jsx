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
  const [previousIngredients, setPreviousIngredients] = useState([]);
  const [seenRecipeIds, setSeenRecipeIds] = useState([]);
  const [lastFilterCondition, setLastFilterCondition] = useState(null);
  const [filterPage, setFilterPage] = useState(1);
  const [selectedAlternative, setSelectedAlternative] = useState({});
  const handleAlternativeSelect = (name, value) => {
    setSelectedAlternative((prev) => ({ ...prev, [name]: value }));
  };
  const [previousSource, setPreviousSource] = useState("");
  

  const displayTimestamp = getCurrentDateTime();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const initialMessage = location.state?.initialMessage;

useEffect(() => {
  if (initialMessage) {
    setInputText(initialMessage);
    handleSend(initialMessage);
  }
}, [initialMessage]);

useEffect(() => {
  const savedSeen = localStorage.getItem("seenRecipeIds");
  const savedFilter = localStorage.getItem("lastFilterCondition");
  const savedPage = localStorage.getItem("filterPage");
  const storedPrevIng = localStorage.getItem("previousIngredients")

  if (savedSeen) setSeenRecipeIds(JSON.parse(savedSeen));
  if (savedFilter) setLastFilterCondition(JSON.parse(savedFilter));
  if (savedPage) setFilterPage(Number(savedPage));
  if (storedPrevIng) setPreviousIngredients(JSON.parse(storedPrevIng));
}, []);

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
              content: `"${recipeData.title}" 레시피에 대해 더 알고 싶으신가요?`,
              time: getCurrentTime(),
            },
          ];
        }
        return prev;
      });
    }
  }, [passedRecipe, recipeData, navigate, location.pathname]);

  const handleSend = async (text) => {
  const userText = (text ?? inputText).trim();
  if (!userText) return;
    setMessages((prev) => [...prev, { id: prev.length + 1, sender: "user", type: "text", content: userText, time: getCurrentTime() }]);
    setInputText("");

    try {
      const levelMatch = userText.match(/(초급|중급|고급|아무나)/);
      const timeMatch = userText.match(/(\d+)\s*분\s*(이내|이상|넘는|초과|이하)?/);
      const hourMatch = userText.match(/(\d+)\s*시간\s*(이내|이상|넘는|초과|이하)?/);

      // 1. 난이도/시간 기반 필터 처리
      if (levelMatch || timeMatch || hourMatch) {
        const difficulty = levelMatch?.[1];

        let maxTime = null;
        let direction = "";
        let cookTimeString = null;

        if (timeMatch) {
          maxTime = parseInt(timeMatch[1], 10);
          direction = timeMatch[2] || "";
        } else if (hourMatch) {
          const hour = hourMatch[1];
          direction = hourMatch[2] || "";

          // 2시간 이상은 문자열 필터로 처리
          if (hour === "2" && ["이상", "넘는", "초과"].some(w => direction.includes(w))) {
            cookTimeString = "2시간 이상";
          } else {
            maxTime = parseInt(hour, 10) * 60;
          }
        }

        let filterOperator = "<=";
        if (["이상", "넘는", "초과"].some(word => direction.includes(word))) {
          filterOperator = ">=";
        }

        setLastFilterCondition({
          difficulty,
          maxTime: cookTimeString ? null : `${filterOperator}${maxTime}`,
          cookTime: cookTimeString || null,
        });

        const res = await axios.get("http://localhost:8000/filter/difficulty-time", {
          params: {
            ...(difficulty && { difficulty }),
            ...(cookTimeString
              ? { cook_time: cookTimeString }
              : maxTime !== null && { max_time: `${filterOperator}${maxTime}` }),
            page: 1,
            per_page: 5,
            exclude_ids: seenRecipeIds,
          },
        });

        const recipes = res.data.recipes || [];
        const botMessage = {
          id: messages.length + 2,
          sender: "bot",
          type: recipes.length > 0 ? "recommendation" : "text",
          content:
            recipes.length > 0
              ? { recipes, source: "difficulty-time" }
              : `${difficulty || ""} ${cookTimeString
                ? `(조리 시간: ${cookTimeString})`
                : maxTime
                  ? `(${filterOperator}${maxTime}분)`
                  : ""
              } 요리를 찾지 못했어요.`,
          time: getCurrentTime(),
        };

        setMessages((prev) => [...prev, botMessage]);
        return;
      }
      // 1-2. 필터 처리 다른 레시피 추천
      if (userText.includes("다른") && lastFilterCondition !== null) {
        const nextPage = filterPage + 1;

        const res = await axios.get("http://localhost:8000/filter/difficulty-time", {
          params: {
            ...(lastFilterCondition.difficulty && {
              difficulty: lastFilterCondition.difficulty,
            }),
            ...(lastFilterCondition.cookTime
              ? { cook_time: lastFilterCondition.cookTime }
              : lastFilterCondition.maxTime && {
                max_time: lastFilterCondition.maxTime,
              }),
            page: nextPage,
            per_page: 5,
            exclude_ids: seenRecipeIds,
          },
        });

        const recipes = res.data.recipes || [];
        setFilterPage(nextPage);

        const botMessage = {
          id: messages.length + 2,
          sender: "bot",
          type: recipes.length > 0 ? "recommendation" : "text",
          content:
            recipes.length > 0 ? { recipes, source: "difficulty-time" } : "더 이상 추천할 레시피가 없어요!",
          time: getCurrentTime(),
        };

        if (recipes.length > 0) {
    setPreviousSource("difficulty-time"); 
  }

        setMessages((prev) => [...prev, botMessage]);
        return;
      }

      // 2. GPT 인분 변환
      const servingMatch = userText.match(/(\d+)\s*(인분|명|인|배)/);
      if (servingMatch && recipeData) {
        const targetServing = `${servingMatch[1]}인분`;
        const res = await axios.post("http://localhost:8000/gpt/servings", {
          title: recipeData.title,
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
            id: recipeData.id,
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

      // 3. GPT 대체 재료 추천
      const substituteKeywords = /(빼고|대신|없어|대체|바꿔)/;
      if (substituteKeywords.test(userText) && recipeData) {
        const ingredientNames = recipeData.ingredients.map((i) => i.split(":")[0].trim());
        const substituteTargets = ingredientNames.filter((name) => userText.includes(name));

        if (substituteTargets.length > 0) {
          const res = await axios.post("http://localhost:8000/gpt/substitute", {
            ingredients: recipeData.ingredients,
            steps: recipeData.steps,
            substitutes: substituteTargets,
            serving: recipeData.serving,
          });

          const result = res.data.result;
          const notify = {
            id: messages.length + 2,
            sender: "bot",
            type: "text",
            content: `다음 재료를 대체했어요: ${substituteTargets.join(", ")}`,
            time: getCurrentTime(),
          };

          const substituteCard = {
            id: messages.length + 3,
            sender: "bot",
            type: "servingsCard",
            content: {
              id: recipeData.id,
              title: recipeData.title,
              serving: recipeData.serving,
              ingredients: result.ingredients,
              steps: result.steps,
              adjustedType: "substitute",
              substitutedKeys: substituteTargets,
            },
            time: getCurrentTime(),
          };
          setMessages((prev) => [...prev, notify, substituteCard]);
          return;
        }
      }

      // 4. GPT 재료 기반 레시피 추천
      const res = await axios.post("http://localhost:8000/gpt/recommend", {
        message: userText,
        previous_ingredients: previousIngredients,
        seen_recipe_ids: seenRecipeIds,
      });

      const recipeList = res.data.recipes;
      setPreviousIngredients(res.data.ingredients || []);
      localStorage.setItem("previousIngredients", JSON.stringify(res.data.ingredients || []));
      setSeenRecipeIds(res.data.seen_recipe_ids || []);

      setLastFilterCondition(null);
      setFilterPage(1);

      const isIngredientSearch = res.data.ingredients?.length > 0;
      const currentSource = isIngredientSearch ? "ingredient" : previousSource || "difficulty-time";

      const botMessage = {
        id: messages.length + 2,
        sender: "bot",
        type: recipeList.length > 0 ? "recommendation" : "text",
        content: recipeList.length > 0 ? { recipes: recipeList,
        source: currentSource, } : "추천 결과가 없어요.",
        time: getCurrentTime(),
      };

      if (recipeList.length > 0) {
        setPreviousSource(currentSource);
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessages((prev) => [...prev, {
        id: messages.length + 2,
        sender: "bot",
        type: "text",
        content: `오류 발생: ${errorMsg}`,
        time: getCurrentTime(),
      }]);
    }
  };

  const clearMessages = () => {
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("recipeForChat");
    localStorage.removeItem("seenRecipeIds");
    localStorage.removeItem("lastFilterCondition");
    localStorage.removeItem("filterPage");
    localStorage.removeItem("previousIngredients");
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
    setPreviousIngredients([]);
    setSeenRecipeIds([]);
    setLastFilterCondition(null);
    setFilterPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // seenRecipeIds가 바뀌면 저장
useEffect(() => {
  localStorage.setItem("seenRecipeIds", JSON.stringify(seenRecipeIds));
}, [seenRecipeIds]);

// lastFilterCondition 바뀌면 저장
useEffect(() => {
  localStorage.setItem("lastFilterCondition", JSON.stringify(lastFilterCondition));
}, [lastFilterCondition]);

// filterPage 바뀌면 저장
useEffect(() => {
  localStorage.setItem("filterPage", filterPage.toString());
}, [filterPage]);


  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] items-center">
      <div className="w-full max-w-md flex flex-col flex-1">
        <Header title="나만의 레시피 검색" showBack onBack={() => navigate(-1)} />
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="text-center text-xs text-gray-400 my-2">
            {displayTimestamp}
          </div>
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex items-start ${msg.sender === "user" ? "justify-end" : "justify-start"} mt-1`}>
                {msg.sender === "bot" && (
                  <img src="/images/chatbot.png" alt="Bot" className="w-12 h-12 rounded-full mr-2" />
                )}
                {msg.type !== "servingsCard" ? (
                  <div className={`px-4 py-2 text-sm rounded-xl max-w-[75%] whitespace-pre-wrap ${msg.sender === "bot"
                    ? "bg-[#ffcb8c] text-[#7a3e0d] rounded-tl-none mt-1.5"
                    : "bg-[#FBF5EF] text-gray-800 rounded-tr-none"
                    }`}>
                    {msg.type === "text" &&
                      msg.content.split("\n").map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    {msg.type === "recommendation" && (
                      <ul className="space-y-1">
                        {msg.content.recipes.map((recipe) => {
                          let emoji = "🍽️"; // 기본값

                          if (msg.content.source === "difficulty-time") emoji = "⏱️";      

                          return (
                            <li key={recipe.id} className="flex items-start">
                              <span className="mr-2">{emoji}</span>
                              <Link to={`/recipe/${recipe.id}`} className="text-blue-600 hover:underline">
                                {recipe.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : msg.content.adjustedType === "substitute" ? (
                  //대체재료 추천 카드 UI
                  <div className="border border-gray-300 bg-white p-4 rounded-xl shadow-sm max-w-[95%]">
                    <div className="text-base font-bold text-gray-900">
                      {msg.content.title} ({msg.content.serving})
                    </div>
                    <div className="text-xs text-gray-500 mt-1 mb-2">
                      일부 재료를 대체한 레시피입니다.
                    </div>
                    <div className="text-sm text-gray-800 font-semibold mb-1">재료</div>
                    {(() => {
                      const substitutedItems = msg.content.substitutedKeys
                        ? msg.content.ingredients.filter(item =>
                          msg.content.substitutedKeys.includes(item.split(":")[0].trim())
                        )
                        : msg.content.ingredients;

                      return (
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                          {substitutedItems.slice(0, 3).map((item, idx) => {
                            const [name, optionsStr] = item.split(":");
                            const options = optionsStr
                              ? optionsStr.split(/\s*\|\s*/) : [];

                            const isProbablyFraction = /^\s*\d+\/\d+/.test(optionsStr);
                            const isSubstitute = optionsStr?.includes("|") && options.length > 1 && !isProbablyFraction;

                            return (
                              <li key={idx} className="text-sm text-gray-700">
                                {isSubstitute ? (
                                  <>
                                    <span className="font-semibold mr-1">{name.trim()}:</span>
                                    <div className="ml-2 mt-1 space-y-1">
                                      {options.map((opt, i) => (
                                        <label
                                          key={i}
                                          className="flex items-center space-x-2 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="radio"
                                            name={`radio-${name.trim()}`}
                                            value={opt}
                                            defaultChecked={i === 0}
                                            onChange={() => handleAlternativeSelect(name.trim(), opt)}
                                          />
                                          <span>{opt}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-semibold mr-1">{name.trim()}:</span>
                                    <span>{optionsStr?.trim()}</span>
                                  </>
                                )}
                              </li>
                            );
                          })}

                          {substitutedItems.length > 0 && (
                            <div
                              className="text-xs text-gray-400 mt-2 ml-5 cursor-pointer"
                              onClick={() => {
                                const defaultSelected = { ...selectedAlternative };

                                msg.content.ingredients.forEach((item) => {
                                  const [name, optionsStr] = item.split(":");
                                  const options = optionsStr.split(/\s*\|\s*/) || [];

                                  const isFraction = /^\s*\d+\/\d+/.test(optionsStr);
                                  const isSubstitute = optionsStr?.includes("|") && options.length > 1 && !isFraction;

                                  // 대체안이면서 선택이 안 되어있으면 기본 1번 설정
                                  if (isSubstitute && !defaultSelected[name.trim()]) {
                                    defaultSelected[name.trim()] = options[0]; // ← 자동 선택
                                  }
                                });

                                navigate(`/recipe/${msg.content.id}`, {
                                  state: {
                                    adjusted: true,
                                    adjustedIngredients: msg.content.ingredients,
                                    adjustedSteps: msg.content.steps,
                                    adjustedServing: msg.content.serving,
                                    selectedAlternative: defaultSelected,
                                  },
                                });
                              }}
                            >
                              ... 더보기
                            </div>
                          )}
                        </ul>
                      );
                    })()}
                  </div>
                ) : (
                  // 기존 인분 변환 카드
                  <div
                    onClick={() =>
                      navigate(`/recipe/${msg.content.id}`, {
                        state: {
                          adjusted: true,
                          adjustedIngredients: msg.content.ingredients,
                          adjustedSteps: msg.content.steps,
                          adjustedServing: msg.content.serving,
                        },
                      })
                    }
                    className="cursor-pointer border border-gray-300 bg-[#FFFFFF] p-4 rounded-xl shadow-sm hover:shadow-md transition max-w-[95%]"
                  >
                    <div className="text-base font-bold text-gray-900">
                      {msg.content.title} ({msg.content.serving})
                    </div>
                    <div className="text-xs text-gray-500 mt-1 mb-2">
                      기존 {recipeData.serving}에서 {msg.content.serving}으로 조정된 레시피입니다.
                    </div>
                    <div className="text-sm text-gray-800 font-semibold mb-1">재료</div>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {msg.content.ingredients.slice(0, 3).map((item, idx) => {
                        const [name, amount] = item.split(":");
                        return (
                          <li key={idx}>
                            <span className="text-gray-800">{name.trim()}</span>
                            {amount && `: ${amount.trim()}`}
                          </li>
                        );
                      })}
                      {msg.content.ingredients.length > 3 && (
                        <li className="text-gray-400 text-xs mt-1">... 더보기</li>
                      )}
                    </ul>
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
            placeholder="메시지를 입력하세요"
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

