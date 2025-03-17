from flask import Blueprint, render_template, request, redirect, url_for, session
from models import db, User  # Import the database and User model

auth_bp = Blueprint('auth', __name__)  # Define the Blueprint

@auth_bp.route('/')
def home():
    return render_template('landingpage.html', user=session.get('user'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        print(request.form) #! For debugging delete later
        age = request.form.get('age')
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')

        if User.query.filter_by(email=email).first():
            error_message = "Email already exists. Please use a different one or login."
            return render_template('SignUp.html', error=error_message)

        new_user = User(age=age, name=name, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()
        return render_template('login.html')

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
            return render_template("Dashboard.html") 
        else:
            return "Invalid credentials."

    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth.home'))
