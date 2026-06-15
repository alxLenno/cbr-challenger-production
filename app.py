import os
from flask import Flask, render_template, redirect, url_for
from flask_login import LoginManager, current_user
from models import db, User
from auth import auth_bp, setup_oauth
from routes import api_bp
from dotenv import load_dotenv

# Bulletproof dotenv loading for PythonAnywhere
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_secret_key")

# Database Configuration (Railway safe)
database_url = os.environ.get("DATABASE_URL", "sqlite:///app.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

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
    return render_template('index.html')

@app.route('/login_page')
def serve_login():
    if current_user.is_authenticated:
        return redirect(url_for('serve_app'))
    return render_template('login.html')

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
