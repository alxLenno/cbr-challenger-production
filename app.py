import os
from flask import Flask, render_template, redirect, url_for, make_response
from flask_login import LoginManager, current_user
from models import db, User
from auth import auth_bp, setup_oauth
from routes import api_bp
from dotenv import load_dotenv

# Bulletproof dotenv loading for PythonAnywhere
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.secret_key = os.environ.get("SECRET_KEY", "dev_secret_key")

# Database Configuration (Railway safe)
database_url = os.environ.get("DATABASE_URL", "sqlite:///app.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # Disable static file caching in dev

# Google OAuth Config
app.config["GOOGLE_CLIENT_ID"] = os.environ.get("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.environ.get("GOOGLE_CLIENT_SECRET")

db.init_app(app)
setup_oauth(app)

login_manager = LoginManager()
login_manager.login_view = 'serve_login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(auth_bp)
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def serve_app():
    if not current_user.is_authenticated:
        return redirect(url_for('serve_login'))
    resp = make_response(render_template('index.html'))
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp

@app.route('/login_page')
def serve_login():
    if current_user.is_authenticated:
        return redirect(url_for('serve_app'))
    return render_template('login.html')

def run_migrations():
    """Safely add new columns to existing tables without losing data."""
    from sqlalchemy import inspect, text
    inspector = inspect(db.engine)
    existing_cols = [col['name'] for col in inspector.get_columns('daily_logs')]
    
    new_columns = {
        'study_method': "VARCHAR(20) DEFAULT 'FID'",
        'open_observation': 'TEXT',
        'open_principles': 'TEXT',
        'open_experience': 'TEXT',
        'open_need': 'TEXT',
        'persons_personal': 'TEXT',
        'persons_english': 'TEXT',
        'persons_references': 'TEXT',
        'persons_satan': 'TEXT',
        'persons_obedience': 'TEXT',
        'persons_note': 'TEXT',
        'persons_stirring': 'TEXT',
    }
    
    for col_name, col_type in new_columns.items():
        if col_name not in existing_cols:
            db.session.execute(text(f'ALTER TABLE daily_logs ADD COLUMN {col_name} {col_type}'))
            print(f'  ✅ Added column: {col_name}')
    
    db.session.commit()

with app.app_context():
    db.create_all()
    try:
        run_migrations()
        print('Database migrations complete.')
    except Exception as e:
        print(f'Migration note: {e}')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
