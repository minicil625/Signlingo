from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from models import db, User  # Import the database and User model
import random,json
from tertiary import get_initials, get_random_question

auth_bp = Blueprint('auth', __name__)  # Define the Blueprint

@auth_bp.route('/')
def home():
    session.clear()
    return render_template('landingpage.html', user=session.get('user'))

# ----------------------------------- AUTHENTICATION ------------------------------------------------

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        print(request.form) #! For debugging delete later
        age = request.form.get('age')

        name = request.form.get('name')
        if name == "":
            name = "Anonymous Wanderer"

        email = request.form.get('email')
        password = request.form.get('password')

        if User.query.filter_by(email=email).first():
            error_message = "Email already exists."
            return render_template('SignUp.html', error=error_message)

        new_user = User(age=age, name=name, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('auth.login'))

    return render_template('SignUp.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        print(request.form) #! Debugging delete later
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email, password=password).first()
        if user:
            session['user'] = email
            session['user_id'] = user.id 
            return redirect(url_for('auth.dashboard'))
        else:
            error_message =  "Invalid credentials."
            return render_template('login.html', error=error_message)
    return render_template('login.html')

@auth_bp.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    user_id = session.get('user_id')
    print(user_id)
    
    if not user_id:
        return redirect(url_for('auth.login'))
    
    login_today = session.get("today_login")
    print(login_today)

    user = User.query.get(user_id)
    full_name = user.name

    first_name,initials = get_initials(full_name)

    return render_template("Dashboard.html",
                           full_name=full_name, 
                           first_name=first_name, 
                           initials=initials,
                           login_today=login_today,)

@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth.home'))

# ----------------------------------- GAME PAGE ------------------------------------------------

with open('questions.json') as f:
    questions = json.load(f)

with open('lessons.json') as f:
    lessons = json.load(f)

with open('ml_questions.json') as f:
    ml_questions = json.load(f)

@auth_bp.route('/ml_game', methods=['GET', 'POST'])
def ml_game():
    return render_template("ML_game.html", user=session.get('user'), lessons=lessons)

@auth_bp.route('/video_learning')
def video_learning():
    return render_template("videolearning.html", user=session.get('user'), lessons=lessons)

@auth_bp.route('/gamepage')
def gamepage():
    return render_template("gamepage.html", user=session.get('user'), lessons=lessons)

@auth_bp.route('/course')
def course():
    user_id = session.get('user_id')
    
    if not user_id:
        return redirect(url_for('auth.login'))
    
    login_today = session.get("today_login")
    print(login_today)

    user = User.query.get(user_id)
    full_name = user.name

    first_name,initials = get_initials(full_name)
    return render_template("courses_final.html", user=session.get('user'), lessons=lessons, initials=initials, first_name=first_name, login_today=login_today)


@auth_bp.route('/get-question')
def get_question():
    question = get_random_question(questions)

    # Randomize the choices
    choices = question['choices']
    random_choices = random.sample(choices, len(choices))  # Shuffle choices

    # Prepare the response
    response = {
        'question': question['question'],
        'choices': random_choices,
        'answer': question['answer'],  # Keep the correct answer
        'image': question['image']
    }

    return jsonify(response)

@auth_bp.route('/get-question-ml')
def get_question_ml():
    question = get_random_question(ml_questions)

    # Prepare the response
    response = {
        'question': question['question'],
        'answer': question['answer'],  # Keep the correct answer
    }

    return jsonify(response)

@auth_bp.route('/check-answer', methods=['POST'])
def check_answer():
    session["today_login"] = True
    data = request.json
    selected = data.get('selected')
    correct = data.get('correct')
    return jsonify({"result": selected == correct})


# ----------------------------------- CNN-LSTM MODEL ------------------------------------------------


import os
import io
import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from PIL import Image
from flask import request, jsonify, render_template, Blueprint
from tensorflow.keras.models import load_model

# Load CNN-LSTM model
MODEL_PATH = 'models/Newest_model_refined_b0.h5'
model = load_model(MODEL_PATH)

# Class labels
CLASSES = [chr(i) for i in range(ord('A'), ord('Z') + 1)]

# Mediapipe hand detector setup
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands_detector = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.3
)

# Image preprocessing
def preprocess_image(arr: np.ndarray, target_size=(224,224)) -> np.ndarray:
    # Resize, preprocess, add batch & sequence dims
    img = cv2.resize(arr, target_size)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = tf.keras.applications.efficientnet.preprocess_input(img)
    img = np.expand_dims(img, axis=0)   # batch
    img = np.expand_dims(img, axis=1)   # sequence
    return img

# Decode model prediction
def decode_prediction(pred: np.ndarray) -> str:
    idx = np.argmax(pred, axis=1)[0]
    return CLASSES[idx]

@auth_bp.route('/capture')
def capture_page():
    return render_template('pose_capture.html')

@auth_bp.route('/predict', methods=['POST'])
def predict():
    # Receive image blob
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    # Read image into OpenCV frame
    data = file.read()
    nparr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Detect hands
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands_detector.process(rgb)
    if not results.multi_hand_landmarks:
        return jsonify({'error': 'No hand detected'}), 400

    # Combine landmarks of both hands into one bounding box
    h, w, _ = frame.shape
    all_xs, all_ys = [], []
    for hand_landmarks in results.multi_hand_landmarks:
        all_xs.extend([lm.x for lm in hand_landmarks.landmark])
        all_ys.extend([lm.y for lm in hand_landmarks.landmark])
    xmin, xmax = int(min(all_xs) * w), int(max(all_xs) * w)
    ymin, ymax = int(min(all_ys) * h), int(max(all_ys) * h)
    margin = 20
    xmin, ymin = max(0, xmin - margin), max(0, ymin - margin)
    xmax, ymax = min(w, xmax + margin), min(h, ymax + margin)

    # Crop combined region
    crop = frame[ymin:ymax, xmin:xmax]
    if crop.size == 0:
        return jsonify({'error': 'Invalid crop'}), 400

    # Draw debug overlay
    debug_frame = frame.copy()
    cv2.rectangle(debug_frame, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
    for hand_landmarks in results.multi_hand_landmarks:
        mp_drawing.draw_landmarks(debug_frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    # Save debug images
    debug_crop_path = os.path.join("static/uploads", 'last_crop.jpg')
    debug_overlay_path = os.path.join("static/uploads", 'last_debug.jpg')
    cv2.imwrite(debug_crop_path, crop)
    cv2.imwrite(debug_overlay_path, debug_frame)

    # Preprocess and predict
    input_tensor = preprocess_image(crop)
    pred = model.predict(input_tensor)
    letter = decode_prediction(pred)

    print(pred)
    session["today_login"] = True

    return jsonify({
        'result': letter,
        'debug_crop_url': '/' + debug_crop_path,
        'debug_overlay_url': '/' + debug_overlay_path
    })