const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const countdownEl = document.getElementById('countdown');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('start-btn');

let questionsAsked = 0;
const TOTAL_QUESTIONS = 10;

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => { console.error('Webcam error:', err); alert('Could not access webcam.'); });

  let correctAnswer; // Ensure this is defined globally if needed
  let prediction; // Ensure this is defined globally if needed

  async function loadQuestion() {
      if (questionsAsked >= TOTAL_QUESTIONS) {
          document.getElementById('question').innerText = '🎉 Quiz Complete!';
          resultEl.textContent = '';
          startBtn.disabled = true; // Disable button since quiz is complete
          return;
      }
  
      const res = await fetch('/get-question-ml');
      const data = await res.json();
      resultEl.textContent = '';
      
      correctAnswer = data.answer;
  
      document.getElementById('question').innerText = data.question;
      document.getElementById('feedback').innerText = '';
      questionsAsked++;
      updateProgress();
  
      startBtn.disabled = false; // Re-enable button for the new question
      startBtn.onclick = startQuiz; // Set the click handler to startQuiz
  }
  
  function startQuiz() {
      startBtn.disabled = true;
      resultEl.textContent = '';
      let count = 5;
      countdownEl.textContent = count;
  
      const interval = setInterval(() => {
          count--;
          if (count > 0) {
              countdownEl.textContent = count;
          } else {
              clearInterval(interval);
              countdownEl.textContent = '';
              // Call the async function to get the result
              captureAndSend()
                  .then(result => checkAnswer(result))
                  .catch(error => {
                      console.error(error);
                      resultEl.textContent = 'Error during prediction.';
                  });
          }
      }, 1000);
  }
  
  function checkAnswer(result) {
    const originalBackground = startBtn.style.background; // Store original background color
    const originalColor = startBtn.style.color; // Store original text color

    if (result === correctAnswer) {
        resultEl.textContent = '✅ Correct!';
        startBtn.style.background = 'var(--correct)';
    } else {
        resultEl.textContent = `❌ Wrong! You showed: ${prediction}`;
        startBtn.style.background = 'var(--incorrect)';
    }
    startBtn.style.color = '#fff';

    // Load a new question after a short delay
    setTimeout(() => {
        // Reset the button styles
        startBtn.style.background = originalBackground;
        startBtn.style.color = originalColor;

        loadQuestion();
    }, 2000);
}
  
  function captureAndSend() {
      return new Promise((resolve, reject) => {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
              const formData = new FormData();
              formData.append('image', blob, 'snapshot.jpg');
              fetch('/predict', { method: 'POST', body: formData })
                  .then(res => res.json())
                  .then(data => {
                        prediction = data.result;
                      resolve(data.result);
                  })
                  .catch(err => {
                      console.error(err);
                      reject('Error during prediction.');
                  });
          }, 'image/jpeg');
      });
  }

function updateProgress() {
    const percent = (questionsAsked / TOTAL_QUESTIONS) * 100;
    document.getElementById('progress-bar').style.width = percent + '%';
  }
  
  window.onload = loadQuestion;