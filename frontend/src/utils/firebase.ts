import { initializeApp } from "firebase/app";
import{getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "digital-project-d3da6.firebaseapp.com",
  projectId: "digital-project-d3da6",
  storageBucket: "digital-project-d3da6.firebasestorage.app",
  messagingSenderId: "130205835052",
  appId: "1:130205835052:web:377b664514f8e4d0981689"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: "select_account consent" })
export{auth,provider}