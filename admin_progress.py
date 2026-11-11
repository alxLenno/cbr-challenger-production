"""Course- and PEG-scoped member reporting and card exports."""
from collections import defaultdict
from datetime import date
from flask import Blueprint, abort, jsonify, redirect, url_for
from flask_login import login_required
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from models import db, User, CardState, ArchivedCard, SessionEvaluation
from courses import progress_access, scoped_participants

admin_progress = Blueprint('admin_progress', __name__)
DAY_FIELDS = {
    'dayNumber': 'day_number', 'wakingTime': 'waking_time', 'bibleBook': 'bible_book',
    'startChapter': 'start_chapter', 'endChapter': 'end_chapter',
    'readingPassages': 'reading_passages', 'morningChapters': 'morning_chapters',
    'laterChapters': 'later_chapters', 'recitedMemory': 'recited_memory',
    'fidJournaling': 'fid_journaling', 'prayer10mins': 'prayer_10mins',
    'dataValidity': 'data_validity', 'cbId': 'cb_id', 'cbResolved': 'cb_resolved',
    'logTimestamp': 'log_timestamp',
}


def require_admin():
    if not progress_access():
        abort(403)


@admin_progress.get('/admin/progress')
@login_required
def dashboard():
    require_admin()
    return redirect(url_for('serve_app', admin='progress'))


def number(value, default=0):
    try:
        return int(value or 0)
    except (ValueError, TypeError):
        return default


def iso_day(value):
    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def clean_card(raw):
    """Return only card-printing data, never journal/prayer/CB narrative text."""
    card = {key: raw.get(key, '') for key in (
        'instanceId', 'commencingDate', 'username', 'contact', 'church', 'peg', 'cohort', 'savedAt')}
    card['currentCardId'] = max(1, min(7, number(raw.get('currentCardId') or raw.get('cardId'), 1)))
    card['participationMode'] = 'course'
    card['round'] = max(1, number(raw.get('round'), 1))
    unique_days = {number(day.get('dayNumber')): {key: day.get(key) for key in DAY_FIELDS}
                   for day in (raw.get('days') or []) if isinstance(day, dict) and 1 <= number(day.get('dayNumber')) <= 28}
    card['days'] = [dict(unique_days[n], dayNumber=n) for n in sorted(unique_days)]
    for day in card['days']:
        day['readingPassages'] = [{k: passage.get(k) for k in ('book', 'startChapter', 'endChapter')}
                                  for passage in (day.get('readingPassages') or []) if isinstance(passage, dict)]
    card['weeks'] = [
        {'weekNumber': i, 'sharedFid': any(number(w.get('weekNumber')) == i and w.get('sharedFid') for w in (raw.get('weeks') or []) if isinstance(w, dict))}
        for i in range(1, 5)
    ]
    return card


def live_card(user, board):
    return clean_card(dict(
        instanceId=board.active_instance_id, currentCardId=board.current_card_id,
        round=board.round, commencingDate=board.commencing_date, username=user.name or user.email,
        contact=board.contact, church=board.church, cohort=board.cohort, peg=board.peg,
        days=[{key: getattr(day, column) for key, column in DAY_FIELDS.items()} for day in board.days],
        weeks=[dict(weekNumber=w.week_number, sharedFid=w.shared_fid) for w in board.weeks]))


def score_card(card):
    """Same 3/2/2/1/1/1 weekly growth rules used by the printed cards."""
    target = card['currentCardId']
    ert = 6 - target / 4
    redeemed = set()
    weeks = []
    for week in range(4):
        counts = dict(reading=0, waking=0, prayer=0, recitation=0, journaling=0)
        for day in card['days']:
            if not week * 7 < number(day['dayNumber']) <= (week + 1) * 7:
                continue
            met = number(day.get('morningChapters')) + number(day.get('laterChapters')) >= target
            cb = str(day.get('cbId') or '')
            if not met and cb and day.get('cbResolved') and cb not in redeemed:
                redeemed.add(cb)
                met = True
            counts['reading'] += bool(met)
            try:
                parts = str(day.get('wakingTime') or '').split(':')
                waking = int(parts[0]) + int(parts[1]) / 60
                counts['waking'] += waking <= ert
            except (IndexError, ValueError):
                pass
            counts['prayer'] += bool(day.get('prayer10mins'))
            counts['recitation'] += bool(day.get('recitedMemory'))
            counts['journaling'] += bool(day.get('fidJournaling'))
        points = sum(weight for key, weight in [('reading', 3), ('waking', 2), ('prayer', 2), ('recitation', 1), ('journaling', 1)] if counts[key] == 7)
        points += bool(card['weeks'][week]['sharedFid'])
        weeks.append(dict(week=week + 1, points=points, **counts, shared=bool(card['weeks'][week]['sharedFid'])))
    return dict(points=sum(w['points'] for w in weeks), weeks=weeks)


def member_report(user, board, archives, evaluations, today=None):
    today = today or date.today()
    cards = {}
    def key(card):
        return card.get('instanceId') or f"{card['round']}:{card['currentCardId']}:{card['commencingDate']}"
    # Newer archive rows win when old data lacks a unique instance ID.
    for archive in sorted(archives, key=lambda a: a.id):
        raw = dict(archive.snapshot_data or {})
        raw.update(instanceId=archive.instance_id, currentCardId=archive.card_id,
                   round=archive.round or 1, commencingDate=archive.commencing_date, savedAt=archive.saved_at)
        raw.setdefault('username', user.name or user.email)
        card = clean_card(raw)
        cards[key(card)] = card
    active = live_card(user, board) if board else None
    if active:
        cards[key(active)] = active
    records = sorted(cards.values(), key=lambda c: (c['round'], c['currentCardId'], str(c['commencingDate'])))
    sessions = {}
    for evaluation in evaluations:
        if not 1 <= evaluation.session_number <= 7:
            continue
        sessions[str(evaluation.session_number)] = dict(
            diligence={str(i): bool(getattr(evaluation, f'diligence_{i}')) for i in range(1, 7)},
            bonus={str(i): bool(getattr(evaluation, f'bonus_{i}')) for i in range(7, 13)},
            submittedAt=evaluation.submitted_at)
    diligence = sum(10 for e in sessions.values() for checked in e['diligence'].values() if checked)
    bonus = sum(50 for checked in sessions.get('7', {}).get('bonus', {}).values() if checked)
    growth = 0
    for card in records:
        card['score'] = score_card(card)
        card['totalScore'] = card['score']['points']
        growth += card['totalScore']
    current = active or dict(days=[], weeks=[], commencingDate='')
    # A log timestamp is set by Save even if only devotional text was entered.
    logged = {number(day['dayNumber']) for day in current['days'] if
              any(day.get(k) for k in ['logTimestamp', 'wakingTime', 'morningChapters', 'laterChapters',
                                      'recitedMemory', 'fidJournaling', 'prayer10mins', 'dataValidity', 'bibleBook'])}
    start = iso_day(current['commencingDate'])
    elapsed = max(0, min(28, (today - start).days)) if start else 0
    missed = len(set(range(1, elapsed + 1)) - logged)
    activity = [str(day.get('logTimestamp')) for c in records for day in c['days'] if iso_day(day.get('logTimestamp'))]
    activity += [str(c['savedAt']) for c in records if iso_day(c.get('savedAt'))]
    activity += [str(e['submittedAt']) for e in sessions.values() if iso_day(e.get('submittedAt'))]
    last = max(activity, key=lambda value: (iso_day(value), value), default=None)
    inactive = bool(last and (today - iso_day(last)).days >= 7)
    flags = []
    if not board:
        flags.append('No current card')
    elif not logged:
        flags.append('No days logged')
    if missed:
        flags.append(f'{missed} missed past day' + ('s' if missed != 1 else ''))
    if inactive:
        flags.append('No activity for 7+ days')
    barriers = sum(bool(d.get('cbId')) and not d.get('cbResolved') for d in current['days'])
    if barriers:
        flags.append(f'{barriers} unresolved barrier log' + ('s' if barriers != 1 else ''))
    pending = sum(1 for n in {c['currentCardId'] for c in records} if not sessions.get(str(n), {}).get('submittedAt'))
    status = 'Not started' if not logged and not activity else 'Needs support' if missed or inactive or barriers else 'On track'
    metrics = {key: sum(bool(d.get(key)) for d in current['days']) for key in ['recitedMemory', 'fidJournaling', 'prayer10mins', 'dataValidity']}
    summary = dict(id=user.id, name=user.name or user.email, email=user.email,
        cohort=board.cohort if board else '', peg=board.peg if board else '',
        contact=board.contact if board else '', church=board.church if board else '',
        current_card_id=board.current_card_id if board else None, round=board.round if board else None,
        startDate=board.commencing_date if board else None, days=len(logged), missed=missed,
        chapters=sum(number(d.get('morningChapters')) + number(d.get('laterChapters')) for d in current['days']),
        currentPoints=score_card(active)['points'] if active else 0, growthPoints=growth,
        diligencePoints=diligence, bonusPoints=bonus, totalPoints=growth + diligence + bonus,
        lastActivity=last[:10] if last else None, status=status, flags=flags,
        pendingEvaluations=pending, barriers=barriers, disciplines=metrics,
        completedCards=sum(len({d['dayNumber'] for d in c['days'] if d.get('logTimestamp') or d.get('morningChapters') or d.get('laterChapters')}) == 28 for c in records))
    profile = dict(username=user.name or user.email, contact=summary['contact'], church=summary['church'],
                   cohort=summary['cohort'], peg=summary['peg'], round=summary['round'] or 1)
    # Reuse the booklet generator without ever assigning another member to appState.
    state = dict(profile, savedCards=records, adminExport=True)
    return dict(member=summary, state=state, evaluations=sessions, records=records)


def course_report(user, board, archives, evaluations, participant):
    cid = participant.course_id
    eligible_board = board if cid and board and board.course_id == cid else None
    report = member_report(user, eligible_board,
        [a for a in archives if cid and (a.snapshot_data or {}).get('courseId') == cid],
        evaluations if eligible_board else [])
    report['member'].update(cohort=participant.requested_cohort, peg=participant.requested_peg,
                            groupId=participant.group_id, courseId=cid,
                            assignment='Assigned' if participant.group_id else 'Awaiting PEG placement')
    return report


def member_progress_context():
    participants = {p.user_id:p for p in scoped_participants().all()}
    users = User.query.filter(User.id.in_(participants)).order_by(User.name, User.email).all()
    latest_ids = db.session.query(func.max(CardState.id).label('id')).group_by(CardState.user_id).subquery()
    boards = CardState.query.join(latest_ids, CardState.id == latest_ids.c.id).options(selectinload(CardState.days), selectinload(CardState.weeks)).all()
    latest = {b.user_id: b for b in boards}
    archives, evaluations = defaultdict(list), defaultdict(list)
    for archive in ArchivedCard.query.all():
        archives[archive.user_id].append(archive)
    for evaluation in SessionEvaluation.query.all():
        evaluations[evaluation.user_id].append(evaluation)
    members = [course_report(u, latest.get(u.id), archives[u.id], evaluations[u.id], participants[u.id])['member'] for u in users]
    cohorts = sorted({m['cohort'] for m in members if m['cohort']}, key=str.casefold)
    pegs = sorted({m['peg'] for m in members if m['peg']}, key=str.casefold)
    cohort_summary = []
    for cohort in cohorts:
        group = [m for m in members if m['cohort'] == cohort]
        participating = sum(m['days'] > 0 for m in group)
        cohort_summary.append(dict(name=cohort, members=len(group), participating=participating,
            participation=round(100 * participating / len(group)),
            points=sum(m['totalPoints'] for m in group), support=sum(m['status'] == 'Needs support' for m in group)))
    return dict(members=members, cohorts=cohorts, pegs=pegs, cohort_summary=cohort_summary,
        rounds=sorted({m['round'] for m in members if m['round']}),
        started=sum(m['days'] > 0 for m in members),
        support=sum(m['status'] == 'Needs support' for m in members),
        complete=sum(m['completedCards'] for m in members))


@admin_progress.get('/admin/api/members/<int:member_id>/progress')
@login_required
def member_detail(member_id):
    require_admin()
    user = db.session.get(User, member_id)
    if user is None:
        abort(404)
    board = CardState.query.options(selectinload(CardState.days), selectinload(CardState.weeks)).filter_by(user_id=user.id).order_by(CardState.id.desc()).first()
    participant = scoped_participants().filter_by(user_id=user.id).first()
    if not participant: abort(403)
    report = course_report(user, board, ArchivedCard.query.filter_by(user_id=user.id).all(),
                           SessionEvaluation.query.filter_by(user_id=user.id).all(), participant)
    response = jsonify(report)
    response.headers['Cache-Control'] = 'private, no-store'
    return response
