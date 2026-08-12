// js/settings.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const settingsForm = document.getElementById('settings-form');
const nameInput = document.getElementById('settings-name');
const emailInput = document.getElementById('settings-email');
const githubInput = document.getElementById('settings-github');

// Theme Color Logic
const colorChips = document.querySelectorAll('.color-chip');
const themeColorInput = document.getElementById('settings-theme-color');

// Handle live preview and chip selection
colorChips.forEach(chip => {
  chip.addEventListener('click', (e) => {
    colorChips.forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    
    const selectedColor = e.target.getAttribute('data-color');
    themeColorInput.value = selectedColor;
    
    // Live preview
    document.documentElement.style.setProperty('--accent-primary', selectedColor);
  });
});

async function init() {
  try {
    currentUser = await requireAuth();
    
    // Populate Firebase Auth fields
    nameInput.value = currentUser.displayName || '';
    emailInput.value = currentUser.email || '';
    
    // Fetch extra user details from Firestore
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.githubUsername) {
        githubInput.value = data.githubUsername;
      }
      
      // Load saved theme color
      if (data.themeColor) {
        themeColorInput.value = data.themeColor;
        document.documentElement.style.setProperty('--accent-primary', data.themeColor);
        
        // Highlight active chip
        colorChips.forEach(c => {
          if(c.getAttribute('data-color') === data.themeColor) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
      } else {
        // Default to peach chip active
        document.querySelector('.color-chip[data-color="#ffcdbd"]')?.classList.add('active');
      }
    }
    
  } catch (err) {
    console.error("Auth error", err);
  }
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = document.getElementById('btn-save-settings');
  const newName = nameInput.value.trim();
  let githubUsername = githubInput.value.trim();
  
  // If the user pasted a full URL, extract just the username
  if (githubUsername.includes('github.com/')) {
    githubUsername = githubUsername.split('github.com/')[1].replace('/', '').split('?')[0];
    githubInput.value = githubUsername; // update the input field visually
  }
  
  try {
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    // 1. Update Firebase Auth Profile
    await updateProfile(currentUser, {
      displayName: newName
    });
    
    const selectedThemeColor = themeColorInput.value;
    
    // Save to localStorage for instant load next time
    localStorage.setItem('themeColor', selectedThemeColor);
    
    await setDoc(doc(db, "users", currentUser.uid), {
      uid: currentUser.uid,
      name: newName,
      githubUsername: githubUsername,
      themeColor: selectedThemeColor
    }, { merge: true });
    
    alert('Settings updated successfully!');
    
    // Update avatar UI globally
    const avatar = document.getElementById('user-avatar');
    if (avatar) {
      avatar.innerHTML = `<span>${newName.charAt(0).toUpperCase()}</span>`;
    }
    
  } catch (err) {
    console.error("Update error", err);
    alert('Failed to update settings.');
  } finally {
    btn.textContent = 'Save Changes';
    btn.disabled = false;
  }
});

init();
