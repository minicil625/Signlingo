let correctAnswer = '';
let questionsAsked = 0;
const TOTAL_QUESTIONS = 10;

async function loadQuestion() {
  if (questionsAsked >= TOTAL_QUESTIONS) {
    document.getElementById('question').innerText = '🎉 Quiz Complete!';
    document.getElementById('choices').innerHTML = '';
    document.getElementById('sign-image').src = '/static/placeholder.png'; // Reset image
    return;
  }

  const res = await fetch('/get-question');
  const data = await res.json();

  correctAnswer = data.answer;

  // Set question text
  document.getElementById('question').innerText = data.question;

  // Set sign image (new!)
  if (data.image) {
    document.getElementById('sign-image').src = data.image;
  } else {
    document.getElementById('sign-image').src = '/static/placeholder.png';
  }

  // Set answer choices
  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  data.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.innerText = choice;
    btn.onclick = () => checkAnswer(choice);
    choicesDiv.appendChild(btn);
  });

  // Reset feedback and update progress
  document.getElementById('feedback').innerText = '';
  questionsAsked++;
  updateProgress();
}

async function checkAnswer(selected) {
  const res = await fetch('/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected, correct: correctAnswer })
  });
  const result = await res.json();
  document.getElementById('feedback').innerText = result.result ? '✅ Correct!' : `❌ Wrong!`;
}

function updateProgress() {
  const percent = (questionsAsked / TOTAL_QUESTIONS) * 100;
  document.getElementById('progress-bar').style.width = percent + '%';
}

window.onload = loadQuestion;
