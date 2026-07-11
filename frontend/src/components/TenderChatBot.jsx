import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { clearTenderChatHistory, getTenderChatHistory, sendTenderChatMessage } from "../api/tenders";

export default function TenderChatBot({ tenderId }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    getTenderChatHistory(tenderId)
      .then((history) => {
        if (mounted) setMessages(history);
      })
      .catch(() => {
        if (mounted) setError("Unable to load chat history.");
      });
    return () => {
      mounted = false;
    };
  }, [tenderId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    setDraft("");
    setError("");
    setMessages((current) => [...current, { role: "user", message }]);
    setLoading(true);

    try {
      const response = await sendTenderChatMessage(tenderId, message);
      setMessages((current) => [...current, response]);
    } catch {
      setError("AI chat is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearTenderChatHistory(tenderId);
      setMessages([]);
      setError("");
    } catch {
      setError("Unable to clear chat history.");
    }
  };

  return (
    <section className="ai-glass-card tender-chatbot">
      <div className="ai-card-head">
        <span><MessageCircle size={18} /> Tender Chat</span>
        <button type="button" onClick={handleClear} aria-label="Clear chat history">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="chat-empty">
            Ask about eligibility, documents, risk, deadlines, or bid strategy.
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={message.id || `${message.role}-${index}`} message={message} />
        ))}
        {loading && (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="chat-error">{error}</p>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask NexTender AI..."
          aria-label="Ask NexTender AI"
        />
        <button type="submit" disabled={loading || !draft.trim()} aria-label="Send message">
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
