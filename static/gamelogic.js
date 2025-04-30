let correctAnswer = '';

async function loadQuestion() {
  const res = await fetch('/get-question');
  const data = await res.json();
  correctAnswer = data.answer;

  document.getElementById('question').innerText = data.question;
  document.getElementById('id').innerText = data.id;
  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';

  data.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.innerText = choice;
    btn.onclick = () => checkAnswer(choice);
    choicesDiv.appendChild(btn);
  });

  document.getElementById('feedback').innerText = '';
}

async function checkAnswer(selected) {
  const res = await fetch('/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected, correct: correctAnswer })
  });
  const result = await res.json();
  document.getElementById('feedback').innerText = result.result ? '✅ Correct!' : '❌ Wrong!';
}

window.onload = loadQuestion;
