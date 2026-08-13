// js/utils.js
import { auth, db } from './firebase.js';
import { logoutUser } from './auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Instant UI Load: Prevent flash of default yellow by loading from localStorage immediately
const savedThemeColor = localStorage.getItem('themeColor');
if (savedThemeColor) {
  document.documentElement.style.setProperty('--accent-primary', savedThemeColor);
}

// Global Profile Dropdown & Logout Logic
document.addEventListener('click', (e) => {
  const userAvatar = document.getElementById('user-avatar');
  const profileDropdown = document.getElementById('profile-dropdown');
  const logoutBtn = document.getElementById('logout-btn');

  // If clicked on avatar
  if (userAvatar && profileDropdown && (e.target === userAvatar || userAvatar.contains(e.target))) {
    e.stopPropagation();
    profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
  } 
  // If clicked outside
  else if (profileDropdown && !profileDropdown.contains(e.target)) {
    profileDropdown.style.display = 'none';
  }

  // Logout button
  if (logoutBtn && (e.target === logoutBtn || logoutBtn.contains(e.target))) {
    if(typeof logoutUser === 'function') logoutUser();
  }
});

// Modal Logic
export function setupModal(modalId, openBtnId, closeBtnId) {
  const modal = document.getElementById(modalId);
  const openBtn = document.getElementById(openBtnId);
  const closeBtn = document.getElementById(closeBtnId);
  const cancelBtn = modal ? modal.querySelector('.btn-cancel') : null;

  function openModal() {
    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    if (modal) modal.classList.remove('active');
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  return { openModal, closeModal };
}

// Generate UUID for document IDs (if doing client-side ID generation)
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Ensure Auth Wrapper
// This function returns a promise that resolves with the User object when Auth is ready
export function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update Avatar immediately using Auth object
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
          if (user.photoURL) {
            avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Profile">`;
          } else if (user.displayName) {
            avatarEl.innerHTML = `<span>${user.displayName.charAt(0).toUpperCase()}</span>`;
          }
        }

        // Fetch user doc to apply global settings like themeColor
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // If they have a name in db but not in auth, use it
            if (!user.photoURL && !user.displayName && data.name && avatarEl) {
                avatarEl.innerHTML = `<span>${data.name.charAt(0).toUpperCase()}</span>`;
            }

            if (data.themeColor) {
              document.documentElement.style.setProperty('--accent-primary', data.themeColor);
              localStorage.setItem('themeColor', data.themeColor); // Sync local storage on load
            }
          }
        } catch (e) {
          console.error("Failed to load user settings:", e);
        }
        resolve(user);
      } else {
        // Redirect to login if no user
        window.location.href = '../login.html';
        reject(new Error("Unauthenticated"));
      }
    });
  });
}

