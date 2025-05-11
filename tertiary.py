def get_initials(full_name):
    name_parts = full_name.split()
    first_name = name_parts[0]
    
    # If there's no last name, use an empty string for the initial
    last_initial = name_parts[1][0] if len(name_parts) > 1 else ''
    
    initials = (first_name[0] + last_initial).upper()  # DJ for "Diven Dechal Jatiputra"
    return first_name, initials

from flask import session, jsonify
import random,json

with open('questions.json') as f:
    questions = json.load(f)

def get_random_question():
    if 'questions_asked' not in session:
        session['questions_asked'] = []  # Track asked questions
    id = random.randint(0, 25)

    while id in session['questions_asked']:
        id = random.randint(0, 25)

    session['questions_asked'].append(id)
    return questions[id]