#!/bin/sh
# This script ensures the app is initialized before starting.

# Exit immediately if a command fails
set -e

# Run the initialization command
echo "Running application setup..."
flask init-app

# Execute the main command passed to this script (e.g., "flask run")
exec "$@"