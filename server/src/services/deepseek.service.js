const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const MAX_CONTEXT_MESSAGES = 30;
const MAX_CONTEXT_CHARS = 12000;

const OUT_OF_SCOPE_MESSAGE =
  "Mình chỉ có thể trả lời các câu hỏi liên quan đến đoạn chat hoặc chủ đề đang được nhắc trong đoạn chat này.";

const extractAiQuestion = (content) => {
  const match = String(content || "").match(/@AI\b\s*([\s\S]*)/i);
  const question = match?.[1]?.trim() || "";
  return question || null;
};

const getSenderName = (message) => {
  if (message.messageType === "ai") return "ZaloUTE AI";
  if (message.senderId?.fullName) return message.senderId.fullName;
  return "Nguoi dung";
};

const getMessageText = (message) => {
  if (message.isRevoked) return "[Tin nhan da bi thu hoi]";
  if (message.messageType === "image") return "[Hinh anh]";
  if (message.messageType === "sticker") return "[Sticker]";
  if (message.messageType === "post_share") return "[Chia se bai viet]";
  if (message.messageType === "story_reply") return `[Tra loi story] ${message.content || ""}`;
  if (message.messageType === "system") return `[He thong] ${message.content || ""}`;
  return message.content || "";
};

const buildConversationContext = (messages) => {
  const lines = (messages || [])
    .filter((message) => message?.messageType !== "system")
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => `${getSenderName(message)}: ${getMessageText(message)}`)
    .filter((line) => line.trim().length > 0);

  const context = lines.join("\n");
  if (context.length <= MAX_CONTEXT_CHARS) return context;

  return context.slice(context.length - MAX_CONTEXT_CHARS);
};

const buildConversationMetadata = (conversation) => {
  if (!conversation) return "Khong co metadata conversation.";

  const participants = conversation.participants || [];
  const participantNames = participants
    .map((participant) => participant?.fullName)
    .filter(Boolean);

  return [
    `Loai chat: ${conversation.isGroup ? "nhom" : "ca nhan"}`,
    conversation.isGroup ? `Ten nhom: ${conversation.name || "Khong co ten"}` : null,
    `So luong thanh vien: ${participants.length}`,
    participantNames.length > 0 ? `Thanh vien: ${participantNames.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

class DeepSeekService {
  static extractAiQuestion(content) {
    return extractAiQuestion(content);
  }

  static getMissingKeyMessage() {
    return "Chưa cấu hình DEEPSEEK_API_KEY nên ZaloUTE AI chưa thể trả lời.";
  }

  static async answerFromConversation({ question, messages, conversation }) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return this.getMissingKeyMessage();
    }

    const baseUrl = process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;
    const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
    const conversationContext = buildConversationContext(messages);
    const conversationMetadata = buildConversationMetadata(conversation);

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: [
              "You are ZaloUTE AI inside a chat conversation.",
              "Answer in Vietnamese.",
              "You may answer questions about the provided chat transcript, topics mentioned in the transcript, summaries or explanations of those topics, and basic conversation metadata such as group name, member count, and member names.",
              "For topics mentioned in the transcript, you may use general knowledge to explain, define, compare, or give lightweight suggestions, but keep the answer connected to the chat topic.",
              "Do not answer questions that are completely unrelated to the transcript or conversation metadata.",
              "If the question is unrelated, answer exactly:",
              `"${OUT_OF_SCOPE_MESSAGE}"`,
              "Do not invent private facts that are not in the transcript or metadata.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              "Metadata conversation:",
              conversationMetadata,
              "",
              "Transcript doan chat:",
              conversationContext || "(Chua co noi dung chat truoc do.)",
              "",
              `Cau hoi sau @AI: ${question}`,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`DeepSeek API error ${response.status}: ${detail}`);
    }

    const data = await response.json();
    return (
      data?.choices?.[0]?.message?.content?.trim() ||
      "Mình chưa tạo được câu trả lời từ nội dung đoạn chat này."
    );
  }
}

module.exports = DeepSeekService;
