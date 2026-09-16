// Public Firebase web configuration, shared by the homepage and VOID//RUNNER.
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
const config={apiKey:'AIzaSyACm01u0QvzvYx52u5fYCKmgj6jyq_1Lk8',authDomain:'the-darknet-district-71873.firebaseapp.com',projectId:'the-darknet-district-71873',storageBucket:'the-darknet-district-71873.firebasestorage.app',messagingSenderId:'166866456762',appId:'1:166866456762:web:6f716b9832e8be9fd27283',measurementId:'G-N60E0QB9DD'};
const app=getApps().length?getApp():initializeApp(config);
const auth=getAuth(app),provider=new GoogleAuthProvider();
export {auth,provider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut};
