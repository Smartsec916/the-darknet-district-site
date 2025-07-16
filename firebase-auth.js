
// Firebase Auth handler for the browser
import { signInWithGoogle, signOutUser, onAuthStateChange } from './lib/firebase.ts';

// Global function to handle Google sign-in
window.enterTheDistrict = async function() {
  try {
    const user = await signInWithGoogle();
    // You can redirect or show a success message here
    alert(`Welcome to The Darknet District, ${user.displayName}!`);
    // Optional: redirect to a dashboard or member area
    // window.location.href = '/dashboard.html';
  } catch (error) {
    console.error('Sign-in failed:', error);
    alert('Sign-in failed. Please try again.');
  }
};

// Monitor auth state changes
onAuthStateChange((user) => {
  if (user) {
    console.log('User is signed in:', user.displayName);
    // Update UI for signed-in user
  } else {
    console.log('User is signed out');
    // Update UI for signed-out user
  }
});
