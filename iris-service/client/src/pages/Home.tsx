import ChatButton from "@/components/chat/ChatButton";
import ChatWindow from "@/components/chat/ChatWindow";

export default function Home() {
  return (
    <>
      {/* Chat Components - No container div, completely transparent */}
      <ChatButton />
      <ChatWindow />
    </>
  );
}
