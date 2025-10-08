let correctAnswer = '';
let questionsAsked = 0;
let correctAnswersCount = 0; // Added to track score
const TOTAL_QUESTIONS = 10;

const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');

function playSound(soundElement) {
    if (soundElement) {
        soundElement.currentTime = 0; // Rewind to the start
        soundElement.play().catch(error => console.error("Error playing sound:", error));
    }
}

function showLoadingState(isLoading) {
    const spinner = document.getElementById('loading-spinner');
    const image = document.getElementById('sign-image');
    if (isLoading) {
        spinner.style.display = 'block';
        image.style.display = 'none';
    } else {
        spinner.style.display = 'none';
        image.style.display = 'block';
    }
}

function showFeedbackBanner(isCorrect, correctAns) {
    const banner = document.getElementById('feedback-banner');
    const feedbackText = document.getElementById('feedback');
    
    banner.classList.remove('correct', 'incorrect');
    if (isCorrect) {
        banner.classList.add('correct');
        feedbackText.innerText = 'Great job!';
    } else {
        banner.classList.add('incorrect');
        feedbackText.innerText = `Correct answer: ${correctAns}`;
    }
    banner.classList.add('show');
}

function hideFeedbackBanner() {
    document.getElementById('feedback-banner').classList.remove('show');
}

async function loadQuestion() {
    if (questionsAsked >= TOTAL_QUESTIONS) {
        const quizCardElement = document.querySelector('.quiz-card');
        const lessonKey = quizCardElement ? quizCardElement.dataset.lessonKey : null;
        quizCompleted(lessonKey); 
        return; 
    }

    showLoadingState(true);
    hideFeedbackBanner();

    try {
        const res = await fetch('/get-question');
        if (!res.ok) {
            throw new Error(`Failed to fetch question. Status: ${res.status}`);
        }
        const data = await res.json();

        correctAnswer = data.answer;
        document.getElementById('question').innerText = data.question;
        
        const signImage = document.getElementById('sign-image');
        signImage.onload = () => showLoadingState(false);
        signImage.src = data.image || '/static/placeholder.png';

        const choicesDiv = document.getElementById('choices');
        choicesDiv.innerHTML = ''; 
        data.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'option-button';
            btn.innerText = choice;
            btn.onclick = () => checkAnswer(choice, btn); 
            choicesDiv.appendChild(btn);
        });

        questionsAsked++;
        updateProgress();

    } catch (error) {
        console.error("Error in loadQuestion:", error);
        document.getElementById('question').innerText = 'Could not load question. Please try refreshing.';
        showLoadingState(false);
    }
}

async function checkAnswer(selected, buttonElement) {
    const options = document.querySelectorAll('.option-button');
    options.forEach(opt => opt.disabled = true);

    try {
        const res = await fetch('/check-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selected: selected, correct: correctAnswer })
        });
        if (!res.ok) throw new Error('Failed to check answer.');

        const result = await res.json();

        showFeedbackBanner(result.result, correctAnswer);

        if (result.result) {
            correctAnswersCount++; // Increment score if correct
            buttonElement.style.background = 'var(--correct-bg)';
            buttonElement.style.borderColor = 'var(--correct-text)';
            playSound(correctSound);
        } else {
            buttonElement.style.background = 'var(--incorrect-bg)';
            buttonElement.style.borderColor = 'var(--incorrect-text)';
            playSound(incorrectSound);
            options.forEach(opt => {
                if (opt.innerText === correctAnswer) {
                    opt.style.background = 'var(--correct-bg)';
                    opt.style.borderColor = 'var(--correct-text)';
                }
            });
        }

        setTimeout(loadQuestion, 2000);

    } catch (error) {
        console.error("Error in checkAnswer:", error);
        alert('Could not check answer due to a network error.');
        options.forEach(opt => opt.disabled = false);
    }
}

function updateProgress() {
    const percent = (questionsAsked / TOTAL_QUESTIONS) * 100;
    document.getElementById('progress-bar').style.width = percent + '%';
}

async function quizCompleted(lessonKeyForThisQuiz) {
    // Hide the image/visual area
    document.querySelector('.quiz-visual-area').style.display = 'none';
    
    // Set completion text
    document.getElementById('question').innerText = 'Quiz Complete!';
    document.getElementById('question').classList.add('quiz-complete-title');

    // Calculate stats
    const xpGained = correctAnswersCount * 10;
    const accuracy = (correctAnswersCount / TOTAL_QUESTIONS) * 100;

    // Display the new, better-designed results
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = `
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
    `;

    showFeedbackBanner(true);

    if (!lessonKeyForThisQuiz || lessonKeyForThisQuiz === 'KEY_NOT_FOUND') {
        console.error("Lesson key is missing. Cannot save progress.");
        document.getElementById('feedback').innerText = 'Quiz complete! Could not save progress (no lesson key).';
        return;
    }

    try {
        const response = await fetch('/mark-lesson-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson_key: lessonKeyForThisQuiz, status: 'completed' })
        });
        if (!response.ok) throw new Error('Server responded with an error.');

        const result = await response.json();
        if (result.success) {
            document.getElementById('feedback').innerText = 'Progress saved! Moving on...';
            setTimeout(() => {
                window.location.href = '/ml_game';
            }, 2500);
        } else {
            throw new Error(result.error || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error saving quiz completion status:', error);
        document.getElementById('feedback').innerText = `Quiz complete, but an error occurred while saving progress.`;
    }
}

window.onload = loadQuestion;