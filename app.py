from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'  # Required for session management


# Import and register the Blueprint
from routes import auth_bp
app.register_blueprint(auth_bp)

db.init_app(app)

from flask_migrate import Migrate
migrate = Migrate(app, db) # <-- Add this line to initialize Flask-Migrate

# Create database tables before first request
@app.cli.command()
def initdb():
    """Initialize the database."""
    with app.app_context():
        db.create_all()
    print("Database initialized successfully!")

# In app.py
@app.cli.command("seed_lessons")
def seed_lessons_command():
    """Seeds the Lesson table from lessons.json."""
    from routes import get_or_create_lessons_from_json # Or from initialization import ...
    with app.app_context(): # Establish app context
        get_or_create_lessons_from_json()
    print("Lessons seeded/updated successfully from lessons.json!")

if __name__ == '__main__':
    app.run(debug=True)

