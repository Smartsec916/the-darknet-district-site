import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";
import ChatMessage from "./ChatMessage";
import { X, Send, Terminal } from "lucide-react";
import { Message } from "@/lib/chat";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import IrisImage from "@assets/008.jpg";

export const ChatWindow = () => {
  const { isOpen, toggleChat, messages, sendMessage, isTyping, buttonRef } = useChat();
  const [input, setInput] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatPosition, setChatPosition] = useState({ bottom: "4.5rem", right: "1.5rem" });
  const { toast } = useToast();
  
  // Calculate position based on the button position
  useEffect(() => {
    const positionChat = () => {
      if (buttonRef?.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const chatWidth = window.innerWidth < 768 ? 320 : 384; // w-80 = 320px, md:w-96 = 384px
        
        // Position the chat directly above the button
        setChatPosition({
          bottom: `${window.innerHeight - buttonRect.top + 5}px`,
          right: `${Math.max(6, window.innerWidth - buttonRect.right - (chatWidth/2) + (buttonRect.width/2))}px`
        });
      }
    };
    
    // Position the chat when it opens
    if (isOpen) {
      positionChat();
      
      // Adjust position on window resize
      window.addEventListener('resize', positionChat);
      return () => window.removeEventListener('resize', positionChat);
    }
  }, [buttonRef, isOpen]);
  
  // Request a transcript email
  const requestTranscript = async (email: string) => {
    try {
      // Email validation
      if (!email || !email.includes('@') || !email.includes('.')) {
        toast({
          title: "Invalid Email",
          description: "Please provide a valid email address.",
          variant: "destructive"
        });
        return;
      }
      
      setIsEmailSending(true);
      
      // Get the session ID from context or sessionStorage
      const sessionId = sessionStorage.getItem('chatSessionId');
      if (!sessionId) {
        toast({
          title: "Session Error",
          description: "No active chat session found.",
          variant: "destructive"
        });
        setIsEmailSending(false);
        return;
      }
      
      // Call the API to request a transcript
      const response = await apiRequest('POST', `/api/chat/${sessionId}/email-transcript`, {
        email
      });
      
      // Handle success
      toast({
        title: "Transcript Sent",
        description: `Chat transcript sent to ${email}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error("Error sending transcript:", error);
      toast({
        title: "Error",
        description: "Could not send transcript. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;
    
    sendMessage(input);
    setInput("");
  };

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    // Wrap in try/catch to handle potential DOMExceptions
    try {
      // Add a small delay to ensure the DOM has been fully updated
      const scrollTimeout = setTimeout(() => {
        if (messagesEndRef.current && document.contains(messagesEndRef.current)) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      
      return () => clearTimeout(scrollTimeout);
    } catch (error) {
      console.error("Scroll error:", error);
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      // Wrap in try/catch to prevent DOMExceptions
      try {
        const focusTimeout = setTimeout(() => {
          if (inputRef.current && document.contains(inputRef.current)) {
            inputRef.current.focus();
          }
        }, 300);
        
        return () => clearTimeout(focusTimeout);
      } catch (error) {
        console.error("Focus error:", error);
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, type: "tween" }}
          style={{ 
            position: 'fixed',
            bottom: chatPosition.bottom,
            right: chatPosition.right,
            zIndex: 50
          }}
          className="w-80 md:w-96 h-[32rem] bg-black/85 border-2 border-pink-600 shadow-2xl overflow-hidden box-glow iris-chat-window neon-border holographic-effect"
          layoutId="chatWindow"
        >
          <div className="relative w-full h-full crt hex-pattern digital-noise">
            <div className="scanline"></div>
            <div className="enhanced-scanline"></div>
            
            {/* Chat Header - With room for profile picture */}
            <div className="border-b-2 border-pink-600 bg-black/90 circuit-border">
              {/* Header buttons */}
              <div className="flex justify-end p-2 gap-3">
                <button 
                  onClick={toggleChat}
                  className="text-white hover:text-pink-500 transition"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Profile and info section */}
              <div className="px-6 pb-4 pt-0">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-600 mr-4 neon-border">
                    <img 
                      src={IrisImage} 
                      alt="Iris" 
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div>
                    <div 
                      className="text-pink-500 font-mono font-bold text-xl tracking-wide holographic-text" 
                      data-text="IRIS">IRIS</div>
                    <div className="flex items-center text-sm mt-1">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      <span className="text-green-400 font-mono data-stream">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat Messages - Fixed scrollbar */}
            <div className="h-[calc(100%-12rem)] overflow-y-auto px-6 py-4 bg-black/80 custom-scrollbar" style={{ overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#ec4899 #000000' }}>
              <div className="space-y-3">
                {messages.map((message: Message, index: number) => (
                  <ChatMessage 
                    key={`message-${index}-${message.sender}`} 
                    message={message} 
                  />
                ))}
                
                {isTyping && (
                  <div className="mb-6 typing-message">
                    {/* Profile image and name */}
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-pink-600 mr-2">
                        <img 
                          src={IrisImage}
                          alt="Iris" 
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                      <div className="text-pink-500 font-mono">Iris</div>
                    </div>
                    
                    {/* Message text with cyberpunk styling */}
                    <div className="bg-[#222222]/90 text-white p-3 rounded-sm border border-pink-600 inline-block max-w-[85%] shadow-md iris-message matrix-text corner-accent" data-text="Analyzing data...">
                      <span className="typing-text font-mono digital-distortion">Analyzing data</span>
                      <span className="enhanced-typing-indicator"></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Chat Input - Ensuring button is fully visible */}
            <div className="border-t-2 border-pink-600 bg-black/90 px-6 py-5 circuit-border">
              {/* Using padding-right to ensure nothing overlaps with the button */}
              <form 
                onSubmit={handleSubmit}
                className="flex items-center gap-4"
              >
                <input 
                  type="text" 
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-[calc(100%-80px)] bg-black/80 border-2 border-pink-600 text-white px-4 py-3 rounded-none focus:outline-none focus:ring-1 focus:ring-pink-600 font-mono terminal-glow corner-accent" 
                  placeholder="Enter command..." 
                />
                {/* Button in its own dedicated space */}
                <button 
                  type="submit" 
                  className="min-w-[60px] h-12 bg-black/80 border-2 border-pink-600 text-pink-500 rounded-none hover:bg-black/95 transition flex items-center justify-center neon-border"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;