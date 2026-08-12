function generatePlan() {
  const goal = document.getElementById("goalInput").value;
  const output = document.getElementById("output");

  output.innerHTML = `
🎯 Goal: ${goal}

📅 Suggested Daily Routine

🌅 6:00 AM - Wake up
📚 7:00 AM - Focused study session
💻 10:00 AM - College / Skill learning
📝 2:00 PM - Revision
🚶 5:00 PM - Exercise / Walk
📖 8:00 PM - Goal review + planning

✅ Habits to Track
- Drink 2L water
- Study 3 hours daily
- 30 min exercise
- Sleep before 11 PM

💡 LifeSync AI Tip
Consistency beats motivation. Focus on small daily progress for the next 90 days.
  `;
}