from flask import Blueprint, redirect, url_for, session, request
from authlib.integrations.flask_client import OAuth
from flask_login import login_user, logout_user, login_required
from models import db, User

auth_bp = Blueprint('auth', __name__)
oauth = OAuth()

def setup_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name='google',
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

@auth_bp.route('/login')
def login():
    redirect_uri = url_for('auth.authorize', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/authorize')
def authorize():
    token = oauth.google.authorize_access_token()
    user_info = token.get('userinfo')
    
    if user_info:
        email = user_info['email']
        google_id = user_info['sub']
        name = user_info.get('name')
        profile_pic = user_info.get('picture')
        
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User(google_id=google_id, email=email, name=name, profile_pic=profile_pic)
            db.session.add(user)
            db.session.commit()
            
        login_user(user)
        return redirect(url_for('serve_app'))
    return redirect(url_for('serve_login'))

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('serve_login'))
