import { Bot, UserRound } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const text = message.message || message.content || "";

  return (
    <div className={`chat-message ${isUser ? "chat-message--user" : "chat-message--ai"}`}>
      <span className="chat-message__avatar" aria-hidden="true">
        {isUser ? <UserRound size={16} /> : <Bot size={16} />}
      </span>
      <div>
        <small>{isUser ? "You" : "NexTender AI"}</small>
        <p>{text}</p>
      </div>
    </div>
  );
}
