let correctAnswer = '';
let questionsAsked = 0;
const TOTAL_QUESTIONS = 10; // Defines how many questions make a complete quiz session

// Function to be called when the quiz is considered complete
async function quizCompleted(lessonKeyForThisQuiz) {
    document.getElementById('question').innerText = '🎉 Quiz Complete!';
    document.getElementById('choices').innerHTML = ''; // Clear choices
    document.getElementById('sign-image').src = '/static/placeholder.png'; // Reset image
    // Feedback will be updated based on save status

    if (!lessonKeyForThisQuiz) {
        console.error("Lesson key is missing, cannot save quiz completion status.");
        document.getElementById('feedback').innerText = 'Quiz complete! Status not saved (no lesson key).';
        return;
    }

    try {
        const response = await fetch('/mark-lesson-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // If you use Flask-WTF CSRF protection, you'd add the CSRF token here
                // 'X-CSRFToken': csrf_token_value
            },
            body: JSON.stringify({
                lesson_key: lessonKeyForThisQuiz,
                status: 'completed'
                // You could add 'score: yourCalculatedScore' if you track scores
            })
        });

        if (!response.ok) {
            // Attempt to get error message from server if available
            const errorData = await response.json().catch(() => ({ error: 'Server error, unable to parse details.' }));
            console.error('Failed to mark lesson status. Status:', response.status, 'Error:', errorData.error);
            document.getElementById('feedback').innerText = `Quiz complete, but progress could not be saved: ${errorData.error || response.statusText}.`;
            return; // Don't reload if saving failed
        }

        const result = await response.json();
        if (result.success) {
            console.log('Quiz status updated successfully.');
            document.getElementById('feedback').innerText = 'Quiz complete and progress saved!';
            // Reload to reflect updated lesson status in the sidebar and module progress
            setTimeout(() => window.location.reload(), 1500); // Reload after a short delay
        } else {
            console.error('Failed to update quiz status (server indicated failure):', result.error);
            document.getElementById('feedback').innerText = `Quiz complete, but progress could not be saved: ${result.error || 'Unknown reason'}.`;
        }
    } catch (error) {
        console.error('Error sending quiz completion status:', error);
        document.getElementById('feedback').innerText = 'Quiz complete, but an error occurred while saving progress.';
    }
}

// Function to load a new question
async function loadQuestion() {
    if (questionsAsked >= TOTAL_QUESTIONS) {
        const quizCardElement = document.querySelector('.quiz-card');
        const lessonKey = quizCardElement ? quizCardElement.dataset.lessonKey : null;
        quizCompleted(lessonKey); // Call the quiz completion function
        return; // Stop further execution of loadQuestion
    }

    try {
        const res = await fetch('/get-question');
        if (!res.ok) {
            console.error("Failed to fetch question. Status:", res.status);
            let errorMsg = 'Error loading question.';
            if (res.status === 401) {
                errorMsg += ' Please ensure you are logged in.';
            } else {
                const serverError = await res.text(); // Get raw text if not JSON
                errorMsg += ` Server responded with: ${res.status}. ${serverError}`;
            }
            document.getElementById('question').innerText = errorMsg;
            document.getElementById('choices').innerHTML = ''; // Clear choices area
            return; // Stop further processing
        }
        const data = await res.json();

        correctAnswer = data.answer;
        document.getElementById('question').innerText = data.question;
        document.getElementById('sign-image').src = data.image || '/static/placeholder.png'; // Fallback if no image

        const choicesDiv = document.getElementById('choices');
        choicesDiv.innerHTML = ''; // Clear previous choices
        data.choices.forEach(choice => {
            const btn = document.createElement('div');
            btn.className = 'option-button';
            btn.innerText = choice;
            btn.onclick = () => checkAnswer(choice, btn); // Pass choice and button element
            choicesDiv.appendChild(btn);
        });

        document.getElementById('feedback').innerText = ''; // Clear previous feedback
        questionsAsked++;
        updateProgress();

    } catch (error) {
        console.error("Error in loadQuestion fetch or processing:", error);
        document.getElementById('question').innerText = 'Could not load question due to a network or script error.';
        document.getElementById('choices').innerHTML = ''; // Clear choices area
    }
}

// Function to check the selected answer
async function checkAnswer(selected, buttonElement) {
    // Disable all option buttons immediately after an answer is chosen
    const options = document.querySelectorAll('.option-button');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.style.opacity = '0.6';
    });

    try {
        const res = await fetch('/check-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selected: selected, correct: correctAnswer })
        });

        if (!res.ok) {
            console.error("Failed to check answer. Status:", res.status);
            document.getElementById('feedback').innerText = 'Error checking answer. Please try again.';
            // Re-enable buttons if server check fails, so user isn't stuck
            options.forEach(opt => {
                opt.style.pointerEvents = 'auto';
                opt.style.opacity = '1';
            });
            return;
        }
        const result = await res.json();

        document.getElementById('feedback').innerText = result.result ? '✅ Correct!' : `❌ Wrong!`;

        // Highlight correct/incorrect
        if (result.result) {
            buttonElement.style.background = 'var(--correct)'; // Assuming CSS variables for colors
            buttonElement.style.color = '#fff';
        } else {
            buttonElement.style.background = 'var(--incorrect)';
            buttonElement.style.color = '#fff';
            // Optionally, find and highlight the correct answer if wrong
            options.forEach(opt => {
                if (opt.innerText === correctAnswer) {
                    // Add a class or style to show it was the correct one, e.g.
                    // opt.style.border = '2px solid var(--correct)';
                }
            });
        }

        // Load next question or trigger completion after a delay
        setTimeout(loadQuestion, 1500);

    } catch (error) {
        console.error("Error in checkAnswer fetch or processing:", error);
        document.getElementById('feedback').innerText = 'Could not check answer due to a network or script error.';
        // Re-enable buttons on error
        options.forEach(opt => {
            opt.style.pointerEvents = 'auto';
            opt.style.opacity = '1';
        });
    }
}

// Function to update the progress bar for quiz questions
function updateProgress() {
    const percent = (questionsAsked / TOTAL_QUESTIONS) * 100;
    const progressBarFill = document.getElementById('progress-bar');
    if (progressBarFill) {
        progressBarFill.style.width = percent + '%';
    }
}

// Start loading the first question when the page loads
window.onload = loadQuestion;