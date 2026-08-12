// js/auth.js
import { auth, db } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorMsg = document.getElementById('error-message');

// Get current page
const currentPage = window.location.pathname.split('/').pop();
const isAuthPage = currentPage === 'login.html' || currentPage === 'register.html';

// Listen to Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    if (isAuthPage) {
      window.location.href = 'pages/dashboard.html';
    }
  } else {
    // No user is signed in.
    if (!isAuthPage && currentPage !== 'index.html' && currentPage !== '') {
      // Redirect to login if trying to access a protected page
      window.location.href = '../login.html';
    }
  }
});

// Display Error Helper
function showError(message) {
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  }
}

// Handle Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    
    try {
      btn.textContent = 'Signing in...';
      btn.disabled = true;
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect happens in onAuthStateChanged
    } catch (error) {
      btn.textContent = 'Sign In';
      btn.disabled = false;
      showError(error.message);
    }
  });
}

// Handle Register
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const btn = document.getElementById('register-btn');

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      btn.textContent = 'Creating account...';
      btn.disabled = true;
      
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Auth Profile
      const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      await updateProfile(user, { displayName: name });
      
      // 2. Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });
      
      // Redirect happens in onAuthStateChanged
    } catch (error) {
      btn.textContent = 'Create Account';
      btn.disabled = false;
      showError(error.message);
    }
  });
}

// Handle GitHub Auth
const btnGithub = document.getElementById('btn-github');
if (btnGithub) {
  btnGithub.addEventListener('click', async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Ensure user profile exists in Firestore (merge to not overwrite)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || (user.email ? user.email.split('@')[0] : "GitHub User"),
        email: user.email || "",
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
    } catch (error) {
      showError(error.message);
    }
  });
}

// Handle Google Auth
const btnGoogle = document.getElementById('btn-google');
if (btnGoogle) {
  btnGoogle.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || (user.email ? user.email.split('@')[0] : "Google User"),
        email: user.email || "",
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
    } catch (error) {
      showError(error.message);
    }
  });
}

// Handle Logout
export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = '../login.html';
  } catch (error) {
    console.error("Logout Error", error);
  }
}
