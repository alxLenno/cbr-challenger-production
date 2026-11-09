"""Read-only member progress dashboard."""
from flask import Blueprint, abort, make_response, render_template
from flask_login import login_required
from sqlalchemy import func, or_, case
from models import db, User, CardState, DailyLog
from routes import is_admin_user

admin_progress = Blueprint('admin_progress', __name__)


@admin_progress.get('/admin/progress')
@login_required
def dashboard():
    if not is_admin_user():
        abort(403)

    # Select only the latest board for each member. Blank days are created
    # ahead of time and must not count as logged days.
    latest = db.session.query(CardState.user_id, func.max(CardState.id).label('id')).group_by(CardState.user_id).subquery()
    chapters = func.coalesce(DailyLog.morning_chapters, 0) + func.coalesce(DailyLog.later_chapters, 0)
    logged = or_(chapters > 0, DailyLog.log_timestamp != '', DailyLog.waking_time != '',
                 DailyLog.recited_memory, DailyLog.fid_journaling, DailyLog.prayer_10mins,
                 DailyLog.data_validity)
    stats = (db.session.query(DailyLog.card_state_id, func.sum(chapters).label('chapters'),
                              func.count(func.distinct(case((logged, DailyLog.day_number)))).label('days'))
             .join(latest, latest.c.id == DailyLog.card_state_id)
             .filter(DailyLog.day_number.between(1, 28)).group_by(DailyLog.card_state_id).subquery())
    members = (db.session.query(User.name, User.email, CardState.current_card_id, CardState.round,
                                CardState.cohort, CardState.peg, stats.c.days, stats.c.chapters)
               .outerjoin(latest, latest.c.user_id == User.id).outerjoin(CardState, CardState.id == latest.c.id)
               .outerjoin(stats, stats.c.card_state_id == CardState.id)
               .order_by(func.lower(func.coalesce(User.name, User.email)), User.id).all())
    response = make_response(render_template('admin_progress.html', members=members,
        cohorts=sorted({m.cohort for m in members if m.cohort}, key=str.casefold),
        started=sum(bool(m.days) for m in members), complete=sum(m.days == 28 for m in members)))
    response.headers['Cache-Control'] = 'private, no-store'
    return response
