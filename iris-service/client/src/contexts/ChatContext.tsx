import { createContext, useContext, useEffect, useState } from "react";
import { Message, fetchWelcomeMessage, simulateIrisResponse } from "@/lib/chat";
import { apiRequest } from "@/lib/queryClient";

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  sendMessage: (text: string) => void;
  isTyping: boolean;
  buttonRef: React.RefObject<HTMLButtonElement> | null;
  setButtonRef: (ref: React.RefObject<HTMLButtonElement>) => void;
}

const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  toggleChat: () => {},
  messages: [],
  sendMessage: () => {},
  isTyping: false,
  buttonRef: null,
  setButtonRef: () => {},
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
  const [clientId, setClientId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Initialize client ID for persistent user identification
  useEffect(() => {
    // Try to retrieve an existing client ID or generate a new one
    try {
      const storedClientId = localStorage.getItem("irisClientId");
      if (storedClientId) {
        setClientId(storedClientId);
      } else {
        // Generate a new client ID if none exists
        const newClientId = crypto.randomUUID ? 
          crypto.randomUUID() : 
          `client_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
        localStorage.setItem("irisClientId", newClientId);
        setClientId(newClientId);
      }
    } catch (error) {
      console.log("Could not access local storage for client ID:", error);
      // Generate a session-only ID if localStorage is unavailable
      const tempClientId = `temp_${Math.random().toString(36).substring(2, 15)}`;
      setClientId(tempClientId);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !sessionId) {
      setIsTyping(true);
      
      const initializeChat = async () => {
        try {
          // Include client ID in session creation for user recognition
          const res = await apiRequest('POST', '/api/chat/session', {
            clientId: clientId || undefined
          });
          const data = await res.json();
          
          // If the server returns a user name from previous sessions, use it
          if (data.userName) {
            setUserName(data.userName);
          }
          
          setSessionId(data.sessionId);
          
          // Safely store sessionId with error handling
          try {
            localStorage.setItem("chatSessionId", data.sessionId); // Store sessionId for security triggers
            sessionStorage.setItem("chatSessionId", data.sessionId); // Store for session management
          } catch (storageError) {
            console.log("Storage access error handled:", storageError);
            // Continue without storing - feature will degrade gracefully
          }
          
          setMood(data.mood || "professional");

          if (data.isNew) {
            try {
              // Pass mood to get mood-specific welcome messages
              const welcomeMessage = await fetchWelcomeMessage(data.mood);
              setTimeout(() => {
                setMessages([{ sender: 'iris', text: welcomeMessage }]);
                setIsTyping(false);
              }, 1500);
            } catch (e) {
              console.error("Failed to fetch welcome message:", e);
              // Ultra-short fallback welcome message (under 10 words)
              setMessages([{ sender: 'iris', text: "Welcome. I'm Iris." }]);
              setIsTyping(false);
            }
          } else {
            try {
              const historyRes = await apiRequest('GET', `/api/chat/${data.sessionId}/history`);
              const history = await historyRes.json();
              
              if (history?.messages?.length > 0) {
                const formatted = history.messages.map((msg: any) => ({
                  sender: msg.sender,
                  text: msg.message
                }));
                setMessages(formatted);
              }
              setIsTyping(false);
            } catch (e) {
              console.error("Failed to fetch chat history:", e);
              setIsTyping(false);
            }
          }
        } catch (e) {
          console.error("Error initializing chat session:", e);
          setIsTyping(false);
          // Ultra-short failure message
          setMessages([{ sender: 'iris', text: "System error. What do you need?" }]);
        }
      };
      
      initializeChat();
    }
  }, [isOpen, sessionId, clientId]);

  const toggleChat = () => {
    // Simply toggle the chat window state
    setIsOpen(!isOpen);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return; // Don't send empty messages
    
    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      if (!sessionId) {
        throw new Error("No active session");
      }
      
      const response = await apiRequest('POST', '/api/chat/message', {
        sessionId,
        message: text,
        clientId: clientId || undefined
      });

      const data = await response.json();
      const delay = Math.min(2000, Math.max(800, data.response.length * 20));

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'iris', text: data.response }]);
      }, delay);
    } catch (error) {
      console.error("Falling back to simulated Iris response due to API failure:", error);
      try {
        const fallback = await simulateIrisResponse(text, mood);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { sender: 'iris', text: fallback }]);
        }, 1500);
      } catch (e) {
        console.error("Even fallback response failed:", e);
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          sender: 'iris', 
          text: "Sorry, my systems are experiencing technical difficulties. Please try again later." 
        }]);
      }
    }
  };

  // Add buttonRef state for positioning
  const [buttonRef, setButtonRefState] = useState<React.RefObject<HTMLButtonElement> | null>(null);
  
  const setButtonRef = (ref: React.RefObject<HTMLButtonElement>) => {
    setButtonRefState(ref);
  };

  return (
    <ChatContext.Provider value={{ 
      isOpen, 
      toggleChat, 
      messages, 
      sendMessage, 
      isTyping,
      buttonRef,
      setButtonRef
    }}>
      {children}
    </ChatContext.Provider>
  );
};