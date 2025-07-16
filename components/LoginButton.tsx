
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in user:", user.displayName);
      
      // Show welcome message similar to your main site
      alert(`Welcome to The Darknet District, ${user.displayName}!`);
    } catch (err) {
      console.error("Login error:", err);
      alert('Sign-in failed. Please try again.');
    }
  };

  return (
    <button className="enter-district-btn game-button" onClick={handleLogin}>
      Enter the District
    </button>
  );
}
