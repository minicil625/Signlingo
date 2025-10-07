from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db
from initialization import get_or_create_lessons_from_json, create_admin_user

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'  # Required for session management


# Import and register the Blueprint
from routes import auth_bp
app.register_blueprint(auth_bp)

db.init_app(app)

from flask_migrate import Migrate
migrate = Migrate(app, db)

@app.cli.command("init-app")
def init_app_command():
    """Initializes the database, seeds lessons, and creates an admin user."""
    with app.app_context():
        # Recreate the database tables
        db.drop_all()
        db.create_all()
        print("Database initialized successfully!")

        # Seed the lessons from the JSON file
        get_or_create_lessons_from_json()
        print("Lessons seeded successfully!")

        # Create the admin user
        create_admin_user()
        print("Admin user check/creation complete.")
    print("Application initialization finished!")

if __name__ == '__main__':
    app.run(debug=True)

