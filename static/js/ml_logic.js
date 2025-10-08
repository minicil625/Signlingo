// --- Global Variables ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const countdownEl = document.getElementById('countdown');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('start-btn');
const questionEl = document.getElementById('question');
const progressBarFill = document.getElementById('progress-bar');
const visualArea = document.querySelector('.quiz-visual-area');
const controlsContainer = document.getElementById('ml-controls');

let questionsAsked = 0;
let correctAnswersCount = 0;
const TOTAL_QUESTIONS = 10;
let correctAnswer;

// --- Webcam Setup ---
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error('Webcam error:', err);
            questionEl.innerText = 'Could not access webcam. Please allow camera access and refresh.';
            if (startBtn) startBtn.disabled = true;
        });
}

// --- Feedback Banner Logic (like game_logic.js) ---
function showFeedbackBanner(isCorrect, correctAns) {
    const banner = document.getElementById('feedback-banner');
    const feedbackText = banner.querySelector('.feedback-text'); // Correctly scope to the banner
    
    banner.classList.remove('correct', 'incorrect');
    if (isCorrect) {
        banner.classList.add('correct');
        feedbackText.innerText = 'Great job!';
    } else {
        banner.classList.add('incorrect');
        feedbackText.innerText = `Incorrect!`;
    }
    banner.classList.add('show');
}

function hideFeedbackBanner() {
    document.getElementById('feedback-banner').classList.remove('show');
}

// --- Session Completion Logic ---
async function mlGameSessionCompleted(lessonKey) {
    // Hide feedback banner from the last question and the webcam disclaimer
    hideFeedbackBanner();
    visualArea.style.display = 'none';
    const disclaimer = document.querySelector('.webcam-disclaimer');
    if (disclaimer) {
        disclaimer.style.display = 'none';
    }

    questionEl.innerText = 'Practice Complete!';
    questionEl.classList.add('quiz-complete-title');

    const accuracy = (correctAnswersCount / TOTAL_QUESTIONS) * 100;
    const xpGained = correctAnswersCount * 10; // 10 XP per correct answer
    
    // Display the results summary
    controlsContainer.innerHTML = `
        <div class="results-grid">
            <div class="result-card">
                <div class="result-card-icon accuracy-icon">
                    <i class="fa-solid fa-bullseye"></i>
                </div>
                <span class="result-card-value">${accuracy.toFixed(0)}%</span>
                <span class="result-card-label">Accuracy</span>
            </div>
            <div class="result-card">
                <div class="result-card-icon xp-icon">
                    <i class="fa-solid fa-star"></i>
                </div>
                <span class="result-card-value">+${xpGained}</span>
                <span class="result-card-label">Total XP</span>
            </div>
        </div>
        <button onclick="window.location.href='/dashboard'" class="dashboard-button">Back to Dashboard</button>
    `;

    if (!lessonKey) {
        console.error("ML Logic: Lesson key is missing, cannot save status.");
        return;
    }

    try {
        await fetch('/mark-lesson-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson_key: lessonKey, status: 'completed' })
        });
        // No longer refreshing the page
    } catch (error) {
        console.error('ML Logic: Error sending completion status:', error);
    }
}

// --- Core ML Game Logic ---
async function loadQuestion() {
    if (questionsAsked >= TOTAL_QUESTIONS) {
        const gameContainer = document.querySelector('.quiz-card');
        const lessonKey = gameContainer ? gameContainer.dataset.lessonKey : null;
        mlGameSessionCompleted(lessonKey);
        return;
    }
    hideFeedbackBanner();
    try {
        const res = await fetch('/get-question-ml');
        if (!res.ok) throw new Error('Failed to fetch ML question.');
        
        const data = await res.json();
        correctAnswer = data.answer;
        questionEl.innerText = data.question;
        resultEl.textContent = '';
        
        questionsAsked++;
        updateProgress();

        startBtn.disabled = false;
        startBtn.style.display = 'block';
        startBtn.textContent = 'Start Pose Capture';
        startBtn.onclick = startCountdown;
    } catch (error) {
        console.error("ML Logic: Error loading question:", error);
        questionEl.innerText = 'Could not load ML challenge.';
        startBtn.disabled = true;
    }
}

function startCountdown() {
    startBtn.disabled = true;
    resultEl.textContent = '';
    let count = 3;
    countdownEl.textContent = count;

    const interval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        if (count === 0) {
            clearInterval(interval);
            captureAndSend();
        }
    }, 1000);
}

async function captureAndSend() {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
        if (!blob) { console.error("ML Logic: Failed to create blob."); return; }
        const formData = new FormData();
        formData.append('image', blob, 'snapshot.jpg');

        try {
            const res = await fetch('/predict', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Prediction request failed.');
            const data = await res.json();
            checkAnswer(data.result);
        } catch (err) {
            console.error("ML Logic: Error during prediction:", err);
            showFeedbackBanner(false, correctAnswer);
            startBtn.disabled = false;
            startBtn.textContent = 'Try Again';
        } finally {
            setTimeout(() => { countdownEl.textContent = ''; }, 1000);
        }
    }, 'image/jpeg');
}

function checkAnswer(predictedLetter) {
    const isCorrect = predictedLetter === correctAnswer;
    if (isCorrect) {
        correctAnswersCount++;
    }
    showFeedbackBanner(isCorrect, correctAnswer);
    setTimeout(loadQuestion, 2000);
}

function updateProgress() {
    const percent = (questionsAsked / TOTAL_QUESTIONS) * 100;
    progressBarFill.style.width = percent + '%';
}

window.onload = loadQuestion;
