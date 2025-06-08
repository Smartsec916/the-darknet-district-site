import { createContext, useContext, useEffect, useState } from "react";
import { Message, fetchWelcomeMessage, simulateIrisResponse } from "@/lib/chat";
import { apiRequest } from "@/lib/queryClient";

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  sendMessage: (text: string) => void;
  isTyping: boolean;
}

const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  toggleChat: () => {},
  messages: [],
  sendMessage: () => {},
  isTyping: false,
});

export const useChat = () => useContext(ChatContext);

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [mood, setMood] = useState<string>("professional");

  useEffect(() => {
    if (isOpen && !sessionId) {
      setIsTyping(true);
      apiRequest('POST', '/api/chat/session', {})
        .then(res => res.json())
        .then(data => {
          setSessionId(data.sessionId);
          setMood(data.mood || "professional");

          if (data.isNew) {
            return fetchWelcomeMessage().then(welcomeMessage => {
              setTimeout(() => {
                setMessages([{ sender: 'iris', text: welcomeMessage }]);
                setIsTyping(false);
              }, 1500);
            });
          } else {
            return apiRequest('GET', `/api/chat/${data.sessionId}/history`)
              .then(res => res.json())
              .then(history => {
                if (history?.messages?.length > 0) {
                  const formatted = history.messages.map((msg: any) => ({
                    sender: msg.sender,
                    text: msg.message
                  }));
                  setMessages(formatted);
                }
                setIsTyping(false);
              });
          }
        })
        .catch(error => {
          console.error("Error initializing chat session:", error);
          setIsTyping(false);
          setMessages([{ sender: 'iris', text: "System startup failed. I'm here anyway — what do you need?" }]);
        });
    }
  }, [isOpen, sessionId]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async (text: string) => {
    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await apiRequest('POST', '/api/chat/message', {
        sessionId,
        message: text
      });

      const data = await response.json();
      const delay = Math.min(2000, Math.max(800, data.response.length * 20));

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'iris', text: data.response }]);
      }, delay);
    } catch (error) {
      console.error("Falling back to simulated Iris response due to API failure:", error);
      const fallback = await simulateIrisResponse(text, mood); // Mood now passed
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'iris', text: fallback }]);
      }, 1500);
    }
  };

  return (
    <ChatContext.Provider value={{ isOpen, toggleChat, messages, sendMessage, isTyping }}>
      {children}
    </ChatContext.Provider>
  );
};