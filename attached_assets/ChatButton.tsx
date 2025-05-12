import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useRef, useEffect } from "react";

export const ChatButton = () => {
  const { toggleChat, setButtonRef } = useChat();
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Register the button ref with the chat context
  useEffect(() => {
    if (buttonRef.current) {
      setButtonRef(buttonRef);
    }
  }, [setButtonRef]);

  return (
    <Button
      ref={buttonRef}
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-4 py-2 h-14 bg-black border-2 border-[hsl(var(--primary))] rounded-lg shadow-lg box-glow hover:bg-[#1A1A1A] transition-all duration-300"
      aria-label="Open chat with Iris"
    >
      <MessageCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
      <span className="text-white font-bold text-base">Chat with Iris</span>
    </Button>
  );
};

export default ChatButton;
