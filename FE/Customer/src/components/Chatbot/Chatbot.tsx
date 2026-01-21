import React, { useState } from "react";
import axios from "axios";

interface Medicine {
  productName: string;
  productDesc: string;
  score: number;
}

const MedicineChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: string; text: string; drugs?: Medicine[] }[]
  >([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1. Thêm tin nhắn của User vào màn hình ngay lập tức
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      // 2. Gọi API đến Django
      const response = await axios.post("http://127.0.0.1:8000/chat/", {
        message: currentInput,
      });

      // 3. Thêm câu trả lời của Bot (được trả về từ Gemini) vào màn hình
      const botMsg = { role: "bot", text: response.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Lỗi:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Lỗi kết nối server rồi!" },
      ]);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded shadow">
      <div className="h-80 overflow-y-auto mb-4 border-b">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}
          >
            <p
              className={`inline-block p-2 rounded ${
                m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {m.text}
            </p>
            {m.drugs &&
              m.drugs.map((drug, idx) => (
                <div
                  key={idx}
                  className="mt-2 text-sm border p-2 rounded bg-green-50"
                >
                  <strong>{drug.productName}</strong> (Độ khớp:{" "}
                  {(drug.score * 100).toFixed(0)}%)
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Nhập triệu chứng..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white p-2 rounded"
        >
          Gửi
        </button>
      </div>
    </div>
  );
};

export default MedicineChat;
