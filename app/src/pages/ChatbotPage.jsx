import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ChatbotPage() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);
  const hasProcessedInitialQuestion = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 초기 마운트 시에는 스크롤하지 않기
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // 메시지가 있을 때만 스크롤
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 초기 질문 자동 전송
  useEffect(() => {
    const initialQuestion = location.state?.initialQuestion;
    if (initialQuestion && !hasProcessedInitialQuestion.current) {
      hasProcessedInitialQuestion.current = true;
      setInput(initialQuestion);
      // 약간의 딜레이 후 자동 전송
      setTimeout(() => {
        const submitEvent = { preventDefault: () => {} };
        handleSendMessage(submitEvent);
      }, 100);
    }
  }, [location.state]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
          threadId: threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 응답 실패');
      }

      const data = await response.json();
      
      setThreadId(data.threadId);
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `오류가 발생했습니다: ${error.message}. 서버가 실행 중인지 확인해주세요.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-messages">
          {messages.length === 0 ? (
            <div className="chatbot-empty">
              <p>안녕하세요! 강의 추천 챗봇입니다.</p>
              <p>원하는 강의 정보를 물어보시거나,</p>
              <p>시간표 구성에 대해 조언을 받으세요!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message ${msg.role}`}
              >
                <div className="chatbot-message-content">
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="chatbot-message assistant">
              <div className="chatbot-message-content">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chatbot-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="챗봇에게 궁금한 물어보세요."
            disabled={isLoading}
            className="chatbot-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="chatbot-button"
          >
            <img src="/icons/send.svg" alt="전송" className="icon-img" />
          </button>
        </form>
      </div>
    </div>
  );
}
