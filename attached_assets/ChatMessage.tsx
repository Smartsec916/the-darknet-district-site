import { motion } from "framer-motion";
import { Message } from "@/lib/chat";
import IrisImage from "@assets/008.jpg";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  if (message.sender === "user") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-row-reverse"
      >
        <div className="bg-[#2A2A2A]/90 text-white p-3 rounded-sm border border-pink-600 inline-block max-w-[75%] shadow-md overflow-hidden corner-accent">
          <span className="font-mono break-words whitespace-pre-wrap holographic-text" data-text={message.text}>{message.text}</span>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Profile image and name */}
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-pink-600 mr-2 neon-border">
          <img 
            src={IrisImage}
            alt="Iris" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="text-pink-500 font-mono holographic-text" data-text="Iris">Iris</div>
      </div>
      
      {/* Message text with cyberpunk styling - with max width and word breaking */}
      <div className="bg-[#222222]/90 text-white p-3 rounded-sm border border-pink-600 inline-block max-w-[75%] shadow-md iris-message overflow-hidden corner-accent circuit-border data-stream" data-text={message.text}>
        <span className="typing-complete font-mono break-words whitespace-pre-wrap matrix-text" data-text={message.text}>{message.text}</span>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
