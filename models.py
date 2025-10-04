from flask_sqlalchemy import SQLAlchemy
from datetime import datetime # Import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    age = db.Column(db.Integer)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False) # Remember to hash passwords in a real app!
    # Relationship to user lesson statuses
    lesson_statuses = db.relationship('UserLessonStatus', backref='user', lazy=True)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # A unique machine-readable key for the lesson, e.g., 'video_main', 'quiz_letters', 'ml_signs'
    # This can be derived from the lesson titles or URLs if they are stable.
    lesson_key = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(200), nullable=True)
    # You might add a 'module_key' or 'module_id' if you have multiple modules
    # For now, we'll assume these lessons are part of one main module implicitly
    order = db.Column(db.Integer, default=0) # To maintain order if needed

    def __repr__(self):
        return f'<Lesson {self.title}>'

class UserLessonStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    # Status: 'not_started', 'in_progress', 'completed'
    status = db.Column(db.String(20), nullable=False, default='not_started')
    score = db.Column(db.Integer, nullable=True) # Optional: for quizzes
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lesson = db.relationship('Lesson') # Makes it easy to access lesson details

    __table_args__ = (db.UniqueConstraint('user_id', 'lesson_id', name='_user_lesson_uc'),)

    def __repr__(self):
        return f'<UserLessonStatus User: {self.user_id} Lesson: {self.lesson_id} Status: {self.status}>'