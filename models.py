from typing import Any
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
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

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    current_card_id = db.Column(db.Integer, default=1)
    commencing_date = db.Column(db.String(20), nullable=False)
    theme = db.Column(db.String(10), default='dark')
    contact = db.Column(db.String(120), nullable=True)
    church = db.Column(db.String(120), nullable=True)
    peg = db.Column(db.String(120), nullable=True)
    cohort = db.Column(db.String(120), nullable=True)
    
    weaknesses = db.relationship('Weakness', backref='card_state', lazy=True, cascade="all, delete-orphan")
    days = db.relationship('DailyLog', backref='card_state', lazy=True, cascade="all, delete-orphan")
    weeks = db.relationship('WeekLog', backref='card_state', lazy=True, cascade="all, delete-orphan")

class Weakness(db.Model):
    __tablename__ = 'weaknesses'

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True)
    card_state_id = db.Column(db.Integer, db.ForeignKey('card_states.id'), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    action = db.Column(db.String(255), nullable=True)

class WeekLog(db.Model):
    __tablename__ = 'week_logs'

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True)
    card_state_id = db.Column(db.Integer, db.ForeignKey('card_states.id'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    shared_fid = db.Column(db.Boolean, default=False)

class DailyLog(db.Model):
    __tablename__ = 'daily_logs'

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
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
    
    # Study Method Fields
    study_method = db.Column(db.String(20), default='FID')
    dif_discovery = db.Column(db.Text, nullable=True)
    dif_insight = db.Column(db.Text, nullable=True)
    dif_fruit = db.Column(db.Text, nullable=True)
    journal_notes = db.Column(db.Text, nullable=True)
    open_observation = db.Column(db.Text, nullable=True)
    open_principles = db.Column(db.Text, nullable=True)
    open_experience = db.Column(db.Text, nullable=True)
    open_need = db.Column(db.Text, nullable=True)
    persons_personal = db.Column(db.Text, nullable=True)
    persons_english = db.Column(db.Text, nullable=True)
    persons_references = db.Column(db.Text, nullable=True)
    persons_satan = db.Column(db.Text, nullable=True)
    persons_obedience = db.Column(db.Text, nullable=True)
    persons_note = db.Column(db.Text, nullable=True)
    persons_stirring = db.Column(db.Text, nullable=True)

class ArchivedCard(db.Model):
    __tablename__ = 'archived_cards'

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instance_id = db.Column(db.String(100), unique=True, nullable=False)
    card_id = db.Column(db.Integer, nullable=False)
    commencing_date = db.Column(db.String(20), nullable=False)
    total_score = db.Column(db.Integer, default=0)
    total_laxity = db.Column(db.Integer, default=0)
    saved_at = db.Column(db.String(30), nullable=False)
    snapshot_data = db.Column(db.JSON, nullable=False)

class SessionEvaluation(db.Model):
    __tablename__ = 'session_evaluations'

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_number = db.Column(db.Integer, nullable=False)  # 1-7, mirrors card_id

    # Diligence criteria (1-6), each true = 10 pts
    diligence_1 = db.Column(db.Boolean, default=False)  # Arrived on TIME
    diligence_2 = db.Column(db.Boolean, default=False)  # Completed ALL session activities
    diligence_3 = db.Column(db.Boolean, default=False)  # 3 review meetings with PEs
    diligence_4 = db.Column(db.Boolean, default=False)  # Scripture Memory & Data Validity 25+ days
    diligence_5 = db.Column(db.Boolean, default=False)  # ORDERLY (mobile off, verses on cards)
    diligence_6 = db.Column(db.Boolean, default=False)  # Promoted CBR (3 people / loaned book)

    # Growth points auto-pulled from archived card score
    growth_points = db.Column(db.Integer, default=0)

    # Bonus items (7-12), each true = 50 pts at end of course
    bonus_7  = db.Column(db.Boolean, default=False)  # Listed 10+ people, brought 5 to next class
    bonus_8  = db.Column(db.Boolean, default=False)  # Practised CBR beyond 5am and 5 chapters
    bonus_9  = db.Column(db.Boolean, default=False)  # Prayed back entire Psalm 119
    bonus_10 = db.Column(db.Boolean, default=False)  # 7 recitation checks on course Scriptures
    bonus_11 = db.Column(db.Boolean, default=False)  # Completed writing principles for all CBs
    bonus_12 = db.Column(db.Boolean, default=False)  # Attended ALL training sessions

    submitted_at = db.Column(db.String(30), nullable=True)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'session_number', name='uq_user_session'),
    )

def auto_migrate_db(app):
    """
    Safely ensures all tables and new columns exist without requiring Alembic/manual migrations.
    Works seamlessly locally, on Railway, and when deployed on PythonAnywhere.
    """
    with app.app_context():
        db.create_all()
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            if 'card_states' in inspector.get_table_names():
                existing_cols = [c['name'] for c in inspector.get_columns('card_states')]
                if 'peg' not in existing_cols:
                    db.session.execute(text("ALTER TABLE card_states ADD COLUMN peg VARCHAR(120)"))
                if 'cohort' not in existing_cols:
                    db.session.execute(text("ALTER TABLE card_states ADD COLUMN cohort VARCHAR(120)"))
            if 'daily_logs' in inspector.get_table_names():
                existing_cols = [c['name'] for c in inspector.get_columns('daily_logs')]
                if 'dif_discovery' not in existing_cols:
                    db.session.execute(text("ALTER TABLE daily_logs ADD COLUMN dif_discovery TEXT"))
                if 'dif_insight' not in existing_cols:
                    db.session.execute(text("ALTER TABLE daily_logs ADD COLUMN dif_insight TEXT"))
                if 'dif_fruit' not in existing_cols:
                    db.session.execute(text("ALTER TABLE daily_logs ADD COLUMN dif_fruit TEXT"))
                if 'journal_notes' not in existing_cols:
                    db.session.execute(text("ALTER TABLE daily_logs ADD COLUMN journal_notes TEXT"))
            db.session.commit()
        except Exception as e:
            print("Auto-migration note:", e)
            db.session.rollback()
