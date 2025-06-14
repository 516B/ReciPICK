import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Clock, User, Star, Heart, Timer, Volume2, Square, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import axios from "axios";

function getStarsByDifficulty(difficulty) {
  switch (difficulty) {
    case "아무나":
    case "초급":
      return 1;
    case "중급":
      return 2;
    case "고급":
      return 3;
    default:
      return 0;
  }
}

export default function RecipePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const [recipe, setRecipe] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState("");

  const adjusted = location.state?.adjusted;
  const adjustedIngredients = location.state?.adjustedIngredients;
  const adjustedSteps = location.state?.adjustedSteps;
  const adjustedServing = location.state?.adjustedServing;
  const selectedAlternative = location.state?.selectedAlternative || {};

  const [showTimer, setShowTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState("");
  const [timerSeconds, setTimerSeconds] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimerSet, setIsTimerSet] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const alarmSound = useRef(new Audio('/sounds/ring.mp3')).current;
  alarmSound.volume = 0.5;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [showMemo, setShowMemo] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [showMemoSaved, setShowMemoSaved] = useState(false);


  const speakSteps = (step) => {
    const utterance = new SpeechSynthesisUtterance(step);
    utterance.lang = "ko-KR";
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
  };

  const handleNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, (adjusted ? adjustedSteps.length : recipe.steps.length) - 1));
    speakSteps(adjusted ? adjustedSteps[currentStepIndex + 1] : recipe.steps[currentStepIndex + 1]);
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/recipe/${id}`);
        setRecipe(res.data);
      } catch (err) {
        setError("레시피를 불러오는 데 실패했습니다.");
        //console.error(err);
      }
    };

    const fetchBookmarkStatus = async () => {
      if (!userId) return;
      try {
        const res = await axios.get("http://localhost:8000/bookmark/", {
          params: { user_id: userId },
        });
        const ids = res.data.recipe_ids.map(Number);
        setIsBookmarked(ids.includes(Number(id)));
      } catch (err) {
        //console.error("찜 상태 확인 실패:", err);
      }
    };

    fetchRecipe();
    fetchBookmarkStatus();
  }, [id, userId]);

  useEffect(() => {
    if (recipe && userId) {
      const newItem = {
        id: recipe.id,
        title: recipe.title,
        image_url: recipe.image_url,
        ingredients: recipe.ingredients,
      };

      // recentViews: 최신 8개만
      const key = `recentViews_${userId}`;
      const viewed = JSON.parse(localStorage.getItem(key) || "[]");
      const updatedRecent = [newItem, ...viewed.filter((item) => item.id !== recipe.id)].slice(0, 8);
      localStorage.setItem(key, JSON.stringify(updatedRecent));

      // longTermViews: 제한 없이 누적 저장
      const longKey = `longTermViews_${userId}`;
      const longList = JSON.parse(localStorage.getItem(longKey) || "[]");
      const updatedLong = [newItem, ...longList.filter((item) => item.id !== recipe.id)];
      localStorage.setItem(longKey, JSON.stringify(updatedLong));
    }
  }, [recipe, userId]);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsTimerSet(false);
      setShowTimeUpModal(true);
      alarmSound.play();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
    } else {
      const totalSeconds =
        (parseInt(timerMinutes, 10) || 0) * 60 +
        (parseInt(timerSeconds, 10) || 0);
      if (totalSeconds > 0) {
        setTimeLeft(totalSeconds);
        setIsRunning(true);
        setIsTimerSet(true);
      }
    }
  };

  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTimerMinutes("");
    setTimerSeconds("");
    setIsTimerSet(false);
  };

  const toggleBookmark = async () => {
    if (!userId) {
      alert("로그인이 필요합니다.");
      navigate("/mypage");
      return;
    }

    try {
      if (isBookmarked) {
        await axios.delete(`http://localhost:8000/bookmark/${id}`, {
          params: { user_id: userId },
        });
        setIsBookmarked(false);
      } else {
        await axios.post(`http://localhost:8000/bookmark/${id}`, null, {
          params: { user_id: userId },
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      //console.error("찜 처리 실패:", err);
    }
  };

  const getCurrentDateTime = () => {
    return new Date().toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSaveMemo = () => {
    const key = `memo_${userId}_${recipe.id}`;
    const memo = { title: recipe.title, text: memoText, time: getCurrentDateTime() };
    localStorage.setItem(key, JSON.stringify(memo));
    setShowMemo(false);
    setMemoText("");
    setShowMemoSaved(true);
  };

  if (error) return <div className="p-4">{error}</div>;
  if (!recipe) return <div className="p-4">로딩 중...</div>;

  if (
    recipe.title === "정보 없음" ||
    recipe.image_url === "정보 없음" ||
    recipe.ingredients?.some((ing) => ing === "정보 없음") ||
    recipe.steps?.some((step) => step === "정보 없음")
  ) {
    return <div className="p-4 text-gray-500">해당 레시피 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center">
      <div className="w-full max-w-md">
        <Header
          title={
            <img
              src="/images/mainlogo.png"
              alt="레시픽 로고"
              className="h-12 object-contain"
            />
          }
          showBack
          onBack={() => navigate(-1)}
        />

        <div className="relative">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-52 object-cover"
          />
        </div>

        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex justify-between items-start mb-6 gap-2">
            <div className="flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold break-words flex-1">{recipe.title}</h2>
                <button onClick={toggleBookmark} className="shrink-0">
                  <Heart
                    size={22}
                    fill={isBookmarked ? "red" : "white"}
                    className={isBookmarked ? "text-red-500" : "text-gray-300"}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={() =>
                navigate("/chat", {
                  state: {
                    recipe: adjusted
                      ? {
                        ...recipe,
                        ingredients: adjustedIngredients,
                        steps: adjustedSteps,
                        serving: adjustedServing,
                      }
                      : recipe,
                  },
                })
              }
              className="text-xs bg-[#2DB431] text-white font-semibold px-3 py-1 rounded-full shadow hover:bg-[#1e7f22] transition whitespace-nowrap"
            >
              💬 Chat
            </button>
          </div>

          <div className="flex justify-center text-center text-gray-500 text-sm px-4">
            <div className="flex gap-12">
              <div className="flex flex-col items-center">
                <User size={18} />
                <span className="mt-1">{adjusted ? adjustedServing : recipe.serving}</span>
              </div>
              <div className="flex flex-col items-center">
                <Clock size={18} />
                <span className="mt-1">{recipe.cook_time}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex gap-1">
                  {Array.from({ length: getStarsByDifficulty(recipe.difficulty) }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        size={18}
                        strokeWidth={2}
                        className="text-gray-600"
                        fill="currentColor"
                      />
                    )
                  )}
                </div>
                <span className="mt-1 text-sm text-gray-500">난이도 {recipe.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white mt-2 border-b border-gray-200">
          <h3 className="text-lg font-bold mb-4">재료</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {(adjusted ? adjustedIngredients : recipe.ingredients).map((item, idx) => {
              const [name, amount] = item.split(":");
              const altText = selectedAlternative[name.trim()] || amount;
              return (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-800">{name.trim()}</span>
                  <span className="text-[#18881C] font-medium">{altText?.trim()}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 bg-white mt-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold">조리순서</h3>
              <button onClick={() => speakSteps(adjusted ? adjustedSteps[currentStepIndex] : recipe.steps[currentStepIndex])}
                className="p-1 rounded-full hover:bg-blue-100 transition"
              >
                <Volume2 size={20} className="text-blue-500" />
              </button>
              <button onClick={stopSpeaking}
                className="p-1 rounded-full hover:bg-red-100 transition"
              >
                <Square size={20} className="text-red-400" />
              </button>
              <button onClick={handleNextStep}
                className="p-1 rounded-full hover:bg-yellow-100 transition"
              >
                <ArrowRight size={20} className="text-yellow-500" />
              </button>
            </div>

            <button
              onClick={() => setShowTimer((prev) => !prev)}
              className="flex items-center space-x-1 text-green-700 text-base font-bold px-3 py-2"
            >
              <span>타이머</span>
              <Timer size={24} />
            </button>
          </div>

          {/* 타이머 UI */}
          {showTimer && (
            <div className="mb-4 p-3 border rounded-md bg-gray-50">
              <div className="relative min-h-[35px]">
                {!isTimerSet ? (
                  <div className="absolute inset-0 flex justify-center items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="분"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(e.target.value.replace(/\D/g, ""))}
                      className="w-16 p-1 border rounded text-center"
                      disabled={isRunning}
                    />
                    <span className="text-xl font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="초"
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(e.target.value.replace(/\D/g, ""))}
                      className="w-16 p-1 border rounded text-center"
                      disabled={isRunning}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center text-2xl font-bold text-gray-800">
                    {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-2 mt-2">
                <button
                  onClick={handleReset}
                  className="bg-red-400 text-white px-2 py-1 text-[13px] rounded-full hover:bg-red-500"
                >
                  초기화
                </button>
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    className="bg-[#2DB431] text-white px-2 py-1 text-[13px] rounded-full hover:bg-green-600"
                  >
                    시작
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="bg-yellow-500 text-white px-2 py-1 text-[13px] rounded-full hover:bg-yellow-600"
                  >
                    멈춤
                  </button>
                )}
              </div>
            </div>
          )}

          {showTimeUpModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-xs w-full text-center shadow-lg">
                <div className="text-2xl font-bold text-red-600 mb-2">⏰ Time Out!</div>
                <button
                  onClick={() => setShowTimeUpModal(false)}
                  className="mt-4 px-4 py-2 bg-[#FDA177] text-white rounded-full font-semibold hover:bg-[#fc5305] transition"
                >
                  확인
                </button>
              </div>
            </div>
          )}


          {showMemoSaved && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-xs w-full text-center shadow-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">📌 저장 완료!</div>
                <div className="text-sm text-gray-700 mb-4">메모가 저장되었습니다.</div>
                <button
                  onClick={() => setShowMemoSaved(false)}
                  className="mt-2 px-4 py-2 bg-[#FDA177] text-white rounded-full font-semibold hover:bg-[#fc5305] transition"
                >
                  확인
                </button>
              </div>
            </div>
          )}

          {(adjusted ? adjustedSteps : recipe.steps).map((step, idx) => {
            const cleanStep = step.replace(/^\d+[\.\)]?\s*/, "");
            return (
              <div key={idx} className="mb-6">
                <div className="flex items-start mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2DB431] text-white text-sm font-bold mr-3">
                    {idx + 1}
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed flex-1">
                    {cleanStep}
                  </p>
                </div>
              </div>
            );
          })}

          {/* 플로팅 메모 버튼 */}
          <button
            onClick={() => setShowMemo(true)}
            className="fixed bottom-20 bg-[#ffe2d9] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg z-50 hover:bg-[#FDA177] transition"
            style={{ left: "calc(50% + 180px)", transform: "translateX(-50%)" }}
            aria-label="메모 작성"
          >
            📝
          </button>

          {/* 메모 작성 모달 */}
          {showMemo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-80 shadow-lg">
                <h2 className="text-lg font-bold mb-2">레시피 메모</h2>
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="이 레시피에 대해 메모해보세요"
                  className="w-full h-24 p-2 border border-gray-300 rounded-md text-sm"
                />
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => setShowMemo(false)}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveMemo}
                    className="bg-[#FDA177] text-white px-3 py-1 rounded-md text-sm hover:bg-[#fc5305]"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
