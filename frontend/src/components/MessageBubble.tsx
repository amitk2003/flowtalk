export default function MessageBubble({ msg, isMe }: any) {
  return (
    <div
      className={`max-w-xs p-2 my-1 rounded-lg ${
        isMe ? "bg-blue-500 text-white self-end" : "bg-gray-200 self-start"
      }`}
    >
      <p>{msg.text}</p>
      <p className="text-xs text-right">
        {msg.status === "sent" && "✓"}
        {msg.status === "delivered" && "✓✓"}
        {msg.status === "read" && "✓✓ (blue)"}
      </p>
    </div>
  );
}
