# Use the specific Python 3.10.4 runtime as the base image. 'slim' is smaller.
FROM python:3.10.4-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required by OpenCV and other libraries
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy your requirements file into the container
COPY requirements.txt .

# Install your Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application's code into the container
COPY . .

# Run the database setup commands during the build process.
# This creates and seeds the SQLite database directly inside the image.
RUN flask db upgrade
RUN flask seed_lessons

# Expose the port that the app runs on
EXPOSE 5000

# The command to run your application when the container starts
CMD ["flask", "run"]