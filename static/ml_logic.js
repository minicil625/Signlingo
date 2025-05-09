const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const countdownEl = document.getElementById('countdown');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('start-btn');

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => { console.error('Webcam error:', err); alert('Could not access webcam.'); });

startBtn.addEventListener('click', () => {
  startBtn.disabled = true;
  resultEl.textContent = '';
  let count = 5;
  countdownEl.textContent = count;
  const interval = setInterval(() => {
    count--;
    if (count > 0) countdownEl.textContent = count;
    else {
      clearInterval(interval);
      countdownEl.textContent = '';
      captureAndSend();
    }
  }, 1000);
});

function captureAndSend() {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('image', blob, 'snapshot.jpg');
    fetch('/predict', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        resultEl.textContent = `Prediction: ${data.result}`;
        startBtn.disabled = false;
      })
      .catch(err => {
        console.error(err);
        resultEl.textContent = 'Error during prediction.';
        startBtn.disabled = false;
      });
  }, 'image/jpeg');
}