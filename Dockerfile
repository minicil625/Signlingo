# Use the specific Python 3.10.4 runtime as the base image. 'slim' is smaller.
FROM python:3.10.4-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy your requirements file
COPY requirements.txt .

# Install your Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application's code
COPY . .

# --- NEW CHANGES START HERE ---

# Copy the entrypoint script into the container
COPY entrypoint.sh .

# Make the entrypoint script executable inside the container
RUN chmod +x entrypoint.sh

# Set the entrypoint to our script
ENTRYPOINT ["./entrypoint.sh"]

# Expose the port that the app runs on
EXPOSE 5000

# The command to run your application (this is passed to the entrypoint script)
CMD ["flask", "run"]