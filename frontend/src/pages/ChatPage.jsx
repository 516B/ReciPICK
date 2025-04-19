import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function ChatPage() {
  const navigate = useNavigate();
  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '나만의 레시피를 검색해보세요!',
      time: getCurrentTime() 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'bot',
          text: `"${newMessage.text}"에 대한 레시피를 검색 중입니다!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] items-center">
      <div className="w-full max-w-md flex flex-col flex-1">
        {/*  Header 컴포넌트 사용 */}
        <Header
          title="나만의 레시피 검색"
          showBack
          onBack={() => navigate(-1)}
        />

        {/* 메시지 리스트 */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="text-center text-xs text-gray-400">{msg.time}</div>
              <div className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mt-1`}>
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 bg-[#fcd9b6] rounded-full flex-shrink-0 mr-2" />
                )}
                <div
                  className={`px-4 py-2 text-sm rounded-xl max-w-[75%] ${
                    msg.sender === 'bot'
                      ? 'bg-[#fde6c8] text-[#7a3e0d] rounded-tl-none'
                      : 'bg-white text-gray-800 border rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* 입력창 */}
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
            className="p-2 bg-[#fef3e8] text-[#7a3e0d] rounded-full hover:bg-[#fce1c8]"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
