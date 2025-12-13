import { useState } from "react";

export default function Chat() {

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:''}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);


  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are a helpful assistant.", 
          messages: [...messages, userMsg].slice(-12), // 최근 12개만 전송
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }

      const { reply } = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>제주대학교 강의 분석 ai</h1>
      <div
        style={{
          border: "1px solid #ddd", 
          borderRadius: 12,
          padding: 12,
          minHeight: 360,
          background: "#fff",
        }}
      >
        
        {messages.length === 0 && (
          <p style={{ color: "#666" }}>
            메시지를 입력해 대화를 시작하세요. (엔터=전송, Shift+Enter=줄바꿈)
          </p>
        )}

        
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              background: m.role === "user" ? "#eef6ff" : "#f5f5f5",
              margin: "8px 0", 
              padding: "10px 12px",
              borderRadius: 10,
            }}
            aria-live="polite"
          >
            <strong>{m.role === "user" ? "나" : "봇"}</strong>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}

        
        {loading && <p>…응답 생성 중</p>}

       
        {err && (
          <p role="alert" style={{ color: "#d33" }}>
            오류: {err}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{ display: "flex", gap: 8, marginTop: 12 }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="질문을 입력하세요"
          rows={3}
          style={{ flex: 1, padding: 10 }}
        />
    
        <button disabled={loading} type="submit">
          전송
        </button>
      </form>
    </div>
  );
}