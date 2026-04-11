#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Seeding demo data..."
python manage.py seed_demo --no-input 2>/dev/null || true

echo "Starting server on port ${PORT:-10000}..."
gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers 2
