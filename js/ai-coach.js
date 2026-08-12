// js/ai-coach.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const typingIndicator = document.getElementById('typing-indicator');

const responses = [
  "That's a great question! When you feel overwhelmed, try breaking your tasks down into 15-minute chunks using the Focus Timer.",
  "I noticed you've been working hard lately. Make sure you're taking adequate breaks to maintain your productivity.",
  "Consistency is key. Focus on maintaining your Habit streaks rather than achieving perfection every single day.",
  "If you're struggling to start, try the 'Two-Minute Rule'. Just commit to doing a task for two minutes. Usually, that's enough to get the momentum going.",
  "Remember to check your Daily Planner. Having a clear overview of your Tasks, Habits, and Study Sessions can significantly reduce mental load.",
  "It looks like you're on a good path. Keep using the Goals tracker to visualize your long-term objectives. It helps align your daily actions."
];

async function init() {
  try {
    currentUser = await requireAuth();
    loadChats();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function loadChats() {
  const q = query(
    collection(db, "users", currentUser.uid, "coachChats"), 
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snapshot) => {
    // Clear everything except typing indicator
    Array.from(chatMessages.children).forEach(child => {
      if (child.id !== 'typing-indicator') {
        chatMessages.removeChild(child);
      }
    });
    
    if (snapshot.empty) {
      appendMessage("Hello! I am your LifeSync AI Coach. I'm here to help you stay productive, manage your time, and reach your goals. What are we focusing on today?", "bot");
      return;
    }

    snapshot.forEach((docSnap) => {
      const chat = docSnap.data();
      appendMessage(chat.text, chat.sender);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = chatInput.value.trim();
  if (!text) return;
  
  // Clear input immediately for better UX
  chatInput.value = '';
  
  try {
    // Save User Message to Firebase
    await addDoc(collection(db, "users", currentUser.uid, "coachChats"), {
      text: text,
      sender: 'user',
      createdAt: new Date().toISOString()
    });
    
    // Show Typing Indicator
    typingIndicator.style.display = 'block';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate AI Response and save to Firebase
    setTimeout(async () => {
      typingIndicator.style.display = 'none';
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      await addDoc(collection(db, "users", currentUser.uid, "coachChats"), {
        text: randomResponse,
        sender: 'bot',
        createdAt: new Date().toISOString()
      });
      
    }, 1500 + Math.random() * 1000);
    
  } catch (err) {
    console.error("Error saving chat", err);
    typingIndicator.style.display = 'none';
  }
});

function appendMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  div.textContent = text;
  
  // Insert before typing indicator
  chatMessages.insertBefore(div, typingIndicator);
}

init();
