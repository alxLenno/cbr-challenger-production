from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True)
    
    # Relationship to cards
    cards = db.relationship('CardState', backref='user', lazy=True)
    archives = db.relationship('ArchivedCard', backref='user', lazy=True)

class CardState(db.Model):
    __tablename__ = 'card_states'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    current_card_id = db.Column(db.Integer, default=1)
    commencing_date = db.Column(db.String(20), nullable=False)
    theme = db.Column(db.String(10), default='dark')
    contact = db.Column(db.String(120), nullable=True)
    church = db.Column(db.String(120), nullable=True)
    
    weaknesses = db.relationship('Weakness', backref='card_state', lazy=True, cascade="all, delete-orphan")
    days = db.relationship('DailyLog', backref='card_state', lazy=True, cascade="all, delete-orphan")
    weeks = db.relationship('WeekLog', backref='card_state', lazy=True, cascade="all, delete-orphan")

class Weakness(db.Model):
    __tablename__ = 'weaknesses'
    id = db.Column(db.Integer, primary_key=True)
    card_state_id = db.Column(db.Integer, db.ForeignKey('card_states.id'), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    action = db.Column(db.String(255), nullable=True)

class WeekLog(db.Model):
    __tablename__ = 'week_logs'
    id = db.Column(db.Integer, primary_key=True)
    card_state_id = db.Column(db.Integer, db.ForeignKey('card_states.id'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    shared_fid = db.Column(db.Boolean, default=False)

class DailyLog(db.Model):
    __tablename__ = 'daily_logs'
    id = db.Column(db.Integer, primary_key=True)
    card_state_id = db.Column(db.Integer, db.ForeignKey('card_states.id'), nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    waking_time = db.Column(db.String(10), nullable=True)
    bible_book = db.Column(db.String(50), nullable=True)
    start_chapter = db.Column(db.Integer, default=0)
    end_chapter = db.Column(db.Integer, default=0)
    morning_chapters = db.Column(db.Integer, default=0)
    later_chapters = db.Column(db.Integer, default=0)
    recited_memory = db.Column(db.Boolean, default=False)
    fid_journaling = db.Column(db.Boolean, default=False)
    prayer_10mins = db.Column(db.Boolean, default=False)
    data_validity = db.Column(db.Boolean, default=False)
    fid_focus = db.Column(db.Text, nullable=True)
    fid_insight = db.Column(db.Text, nullable=True)
    fid_doing = db.Column(db.Text, nullable=True)
    scripture_memorized = db.Column(db.String(120), nullable=True)
    prayer_topic = db.Column(db.String(255), nullable=True)
    cb_id = db.Column(db.String(10), nullable=True)
    cb_solution = db.Column(db.String(255), nullable=True)
    cb_scripture = db.Column(db.String(255), nullable=True)
    cb_resolved = db.Column(db.Boolean, default=False)
    log_timestamp = db.Column(db.String(30), nullable=True)

class ArchivedCard(db.Model):
    __tablename__ = 'archived_cards'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instance_id = db.Column(db.String(100), unique=True, nullable=False)
    card_id = db.Column(db.Integer, nullable=False)
    commencing_date = db.Column(db.String(20), nullable=False)
    total_score = db.Column(db.Integer, default=0)
    total_laxity = db.Column(db.Integer, default=0)
    saved_at = db.Column(db.String(30), nullable=False)
    snapshot_data = db.Column(db.JSON, nullable=False)
