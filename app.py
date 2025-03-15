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

# Create database tables before first request
@app.cli.command()
def initdb():
    """Initialize the database."""
    with app.app_context():
        db.create_all()
    print("Database initialized successfully!")

if __name__ == '__main__':
    app.run(debug=True)

