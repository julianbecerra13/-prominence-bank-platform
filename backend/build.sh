#!/usr/bin/env bash
set -o errexit

pip install --no-cache-dir -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py seed_demo --no-input 2>/dev/null || true
