from flask import current_app
# Adjust the import path for models if initialization.py is in a different location
# If in the same directory as models.py:
from models import db, Lesson, User
# If models.py is in the parent directory (e.g., project_root/models.py)
# and initialization.py is in project_root/your_app_package/initialization.py,
# you might need from ..models import db, Lesson, or ensure your Python path is set up.
# Assuming a flat structure for now where models.py is accessible:
# from .models import db, Lesson # if initialization.py is part of a package
import json

def get_or_create_lessons_from_json():
    """
    Reads lessons from lessons.json and populates the Lesson database table.
    """
    lessons_data_from_json = []
    try:
        # Robust path to lessons.json, assuming it's in the instance folder or project root
        # Or ensure it's placed where this script can find it.
        # For instance_path: config_file_path = os.path.join(current_app.instance_path, 'lessons.json')
        # For now, assuming it's findable from the project root:
        with open('lessons.json') as f:
            lessons_data_from_json = json.load(f)
    except FileNotFoundError:
        current_app.logger.error("lessons.json not found. No lessons will be loaded.")
        return []
    except json.JSONDecodeError:
        current_app.logger.error("Error decoding lessons.json. Check its format.")
        return []

    # No need for 'with current_app.app_context()' here if this function
    # will always be *called* from within an active app context (e.g., from the CLI command).
    # However, if you want it to be callable from anywhere, keeping it is safer.
    # For a CLI command that establishes its own app_context, it's fine without it here.
    # Let's assume the caller (CLI command) sets up the app context.

    saved_lessons = []
    for idx, lesson_data_item in enumerate(lessons_data_from_json):
        title = lesson_data_item.get('title')
        if not title:
            current_app.logger.warning(f"Skipping lesson item due to missing title: {lesson_data_item}")
            continue
        lesson_key = title.lower().replace(' ', '_')

        lesson = Lesson.query.filter_by(lesson_key=lesson_key).first()
        if not lesson:
            lesson = Lesson(
                lesson_key=lesson_key,
                title=title,
                url=lesson_data_item.get('url'),
                order=idx
            )
            db.session.add(lesson)
            current_app.logger.info(f"Creating new lesson: {title} (Key: {lesson_key})")
        else:
            lesson.title = title
            lesson.url = lesson_data_item.get('url')
            lesson.order = idx
            current_app.logger.info(f"Updating existing lesson: {title} (Key: {lesson_key})")
        saved_lessons.append(lesson) # Keep track of processed lessons for returning from DB

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database commit failed while seeding lessons: {e}")
        return []

    # Fetch the saved/updated lessons by their keys or just re-query all
    # This ensures we return actual DB objects consistent with the commit.
    # If saved_lessons contains newly added items, their IDs might not be populated
    # until after commit and refresh. So re-querying is safer.
    return Lesson.query.order_by(Lesson.order).all()

def create_admin_user():
    """
    Checks for an existing admin user and creates one if not found.
    """
    # Check if admin user already exists
    admin_email = "admin@example.com"
    user = User.query.filter_by(email=admin_email).first()

    if not user:
        # Create a new admin user if one doesn't exist
        admin_user = User(
            name="Admin",
            age=99,
            email=admin_email,
            password="admin"  # IMPORTANT: In a real application, you must hash this password!
        )
        db.session.add(admin_user)
        try:
            db.session.commit()
            current_app.logger.info(f"Admin user created with email: {admin_email}")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Failed to create admin user: {e}")
    else:
        current_app.logger.info(f"Admin user with email {admin_email} already exists.")