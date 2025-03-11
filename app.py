from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'  # Required for session management

db = SQLAlchemy(app)

# Import and register the Blueprint
from routes import auth_bp
app.register_blueprint(auth_bp)

# Create database tables before first request
@app.cli.command()
def initdb():
    """Initialize the database."""
    db.create_all()
    print("Database initialized successfully!")

if __name__ == '__main__':
    app.run(debug=True)

