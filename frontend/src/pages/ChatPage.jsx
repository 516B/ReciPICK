import { ArrowLeft, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '나만의 레시피를 검색해보세요!', time: '10:30' }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // 자동 스크롤 아래로
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

    // 나중에 GPT 응답 붙일 자리
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
        {/* Header */}
        <header className="bg-[#fef3e8] p-4 flex items-center justify-between border-b border-orange-200">
          <button onClick={() => navigate(-1)} className="text-[#7a3e0d]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-md font-semibold text-[#7a3e0d]">나만의 레시피 검색</h1>
          <div className="w-5" />
        </header>

        {/* Chat Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="text-center text-xs text-gray-400">{msg.time}</div>
              <div className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mt-1`}>
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 bg-[#fcd9b6] rounded-full flex-shrink-0 mr-2" />
                )}
                <div
                  className={`
                    px-4 py-2 text-sm rounded-xl max-w-[75%]
                    ${msg.sender === 'bot'
                      ? 'bg-[#fde6c8] text-[#7a3e0d] rounded-tl-none'
                      : 'bg-white text-gray-800 border rounded-tr-none'}
                  `}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
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
