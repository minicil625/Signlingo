from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()

# Association table for friendships
friendship = db.Table('friendship',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('friend_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    age = db.Column(db.Integer)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    points = db.Column(db.Integer, default=0)
    lesson_statuses = db.relationship('UserLessonStatus', backref='user', lazy=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # Streaks
    streak = db.Column(db.Integer, default=0)
    last_login_date = db.Column(db.Date, default=date.today)

    friends = db.relationship('User',
                               secondary=friendship,
                               primaryjoin=(friendship.c.user_id == id),
                               secondaryjoin=(friendship.c.friend_id == id),
                               backref=db.backref('friend_of', lazy='dynamic'),
                               lazy='dynamic')

    # Add Friends
    def add_friend(self, user):
        if not self.is_friends_with(user):
            self.friends.append(user)
            user.friends.append(self)

    def remove_friend(self, user):
        if self.is_friends_with(user):
            self.friends.remove(user)
            user.friends.remove(self)

    def is_friends_with(self, user):
        return self.friends.filter(friendship.c.friend_id == user.id).count() > 0

    @property
    def league(self):
        if self.points < 100:
            return "Bronze"
        elif self.points < 500:
            return "Silver"
        elif self.points < 1000:
            return "Gold"
        else:
            return "Diamond"

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    modules = db.relationship('Module', backref='course', lazy=True)

    def __repr__(self):
        return f'<Course {self.title}>'

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    units = db.relationship('Unit', backref='module', lazy=True)
    order = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<Module {self.title}>'

class Unit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('module.id'), nullable=False)
    lessons = db.relationship('Lesson', backref='unit', lazy=True)
    order = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<Unit {self.title}>'

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_key = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(200), nullable=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('unit.id'), nullable=False)
    order = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<Lesson {self.title}>'

class UserLessonStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='not_started')
    score = db.Column(db.Integer, nullable=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lesson = db.relationship('Lesson')

    __table_args__ = (db.UniqueConstraint('user_id', 'lesson_id', name='_user_lesson_uc'),)

    def __repr__(self):
        return f'<UserLessonStatus User: {self.user_id} Lesson: {self.lesson_id} Status: {self.status}>'