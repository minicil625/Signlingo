let correctAnswer = '';
let questionsAsked = 0;
const TOTAL_QUESTIONS = 10;

async function loadQuestion() {
  if (questionsAsked >= TOTAL_QUESTIONS) {
    document.getElementById('question').innerText = '🎉 Quiz Complete!';
    document.getElementById('choices').innerHTML = '';
    document.getElementById('sign-image').src = '/static/placeholder.png';
    return;
  }

  const res = await fetch('/get-question');
  const data = await res.json();

  correctAnswer = data.answer;

  document.getElementById('question').innerText = data.question;
  document.getElementById('sign-image').src = data.image || '/static/placeholder.png';

  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  data.choices.forEach(choice => {
    const btn = document.createElement('div');
    btn.className = 'option-button';
    btn.innerText = choice;
    btn.onclick = () => checkAnswer(choice, btn);
    choicesDiv.appendChild(btn);
  });

  document.getElementById('feedback').innerText = '';
  questionsAsked++;
  updateProgress();
}

async function checkAnswer(selected, buttonElement) {
  const res = await fetch('/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected, correct: correctAnswer })
  });
  const result = await res.json();

  document.getElementById('feedback').innerText = result.result ? '✅ Correct!' : `❌ Wrong!`;

  // Disable all options
  const options = document.querySelectorAll('.option-button');
  options.forEach(opt => {
    opt.style.pointerEvents = 'none';
    opt.style.opacity = '0.6';
  });

  // Highlight correct/incorrect
  if (result.result) {
    buttonElement.style.background = 'var(--correct)';
    buttonElement.style.color = '#fff';
  } else {
    buttonElement.style.background = 'var(--incorrect)';
    buttonElement.style.color = '#fff';
  }

  // Load next question after delay
  setTimeout(loadQuestion, 1500);
}

function updateProgress() {
  const percent = (questionsAsked / TOTAL_QUESTIONS) * 100;
  document.getElementById('progress-bar').style.width = percent + '%';
}

window.onload = loadQuestion;
