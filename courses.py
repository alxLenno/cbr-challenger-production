"""Course enrollment, PEG membership and group-scoped leadership."""
import math
import re
import secrets
from functools import wraps
from flask import Blueprint, abort, current_app, jsonify, request, session
from flask_login import current_user, login_required
from itsdangerous import URLSafeTimedSerializer, BadSignature
from sqlalchemy import func, update
from sqlalchemy.exc import IntegrityError
from models import db, User, CardState, Course, PegGroup, Participation, PegLeader

course_api = Blueprint('courses', __name__, url_prefix='/api/courses')


@course_api.errorhandler(400)
@course_api.errorhandler(403)
@course_api.errorhandler(404)
@course_api.errorhandler(409)
def course_error(error):
    return jsonify(error=error.description), error.code
POLICIES = {'women', 'men', 'mixed'}


def full_admin():
    from routes import is_admin_user
    return is_admin_user()


def leader_groups():
    if not current_user.is_authenticated:
        return []
    return [r[0] for r in db.session.query(PegLeader.group_id).join(Participation,
        Participation.user_id == PegLeader.user_id).filter(PegLeader.user_id == current_user.id,
        Participation.mode == 'course', Participation.group_id == PegLeader.group_id).all()]


def progress_access():
    return full_admin() or bool(leader_groups())


def scoped_participants():
    query = Participation.query.filter_by(mode='course')
    return query if full_admin() else query.filter(Participation.group_id.in_(leader_groups()))


def csrf_token():
    if 'course_csrf' not in session:
        session['course_csrf'] = secrets.token_urlsafe(32)
    return session['course_csrf']


def payload():
    if not secrets.compare_digest(str(request.headers.get('X-CSRF-Token', '')), str(session.get('course_csrf') or secrets.token_urlsafe(32))):
        abort(403, description='Refresh this page and try again.')
    data = request.get_json()
    if not isinstance(data, dict):
        abort(400, description='Expected a JSON object.')
    return data


def admin_route(function):
    @wraps(function)
    @login_required
    def wrapped(*args, **kwargs):
        if not full_admin():
            abort(403)
        return function(*args, **kwargs)
    return wrapped


def text(value):
    if not isinstance(value, str) or len(value.strip()) > 120:
        abort(400, description='Use text up to 120 characters.')
    return value.strip()


def cohort_name(value):
    value=text(value)
    match=re.fullmatch(r'(?:cohort\s*)?([1-9]\d*)',value,re.I)
    if value and not match:
        abort(400,description='Use a cohort number, for example Cohort 18.')
    return 'Cohort '+str(int(match[1])) if match else ''


def peg_name(value):
    value=text(value)
    match=re.fullmatch(r'(?:peg\s*)?([1-9]\d*)',value,re.I)
    if value and not match:
        abort(400,description='Use a PEG number, for example PEG 11.')
    return 'PEG '+str(int(match[1])) if match else ''


def group_rules(data):
    try:
        minimum, maximum = int(data['minimum']), int(data['maximum'])
    except (KeyError, ValueError, TypeError):
        abort(400, description='Enter a minimum and maximum group size.')
    policy = data.get('policy', 'mixed')
    if not 1 <= minimum <= maximum <= 100 or policy not in POLICIES:
        abort(400, description='Group sizes must be 1–100, with minimum no greater than maximum.')
    return minimum, maximum, policy


def gender_allowed(participant, policy):
    return policy == 'mixed' or participant.gender == {'women':'woman', 'men':'man'}[policy]


def try_group(participant, group, strict=False):
    # Acquire a write/row lock before checking capacity (also serializes SQLite writes).
    db.session.execute(update(PegGroup).where(PegGroup.id==group.id).values(name=PegGroup.name))
    size = Participation.query.filter_by(mode='course', group_id=group.id).filter(Participation.user_id != participant.user_id).count()
    reason = None
    if not gender_allowed(participant, group.policy):
        reason = 'This PEG does not match the member’s gender selection.'
    elif size >= group.maximum:
        reason = 'This PEG is full.'
    if reason:
        if strict:
            abort(409, description=reason)
        return reason
    participant.group_id = group.id
    participant.requested_peg = group.name
    return None


def sync_membership(participant):
    course = db.session.get(Course, participant.course_id) if participant.course_id else None
    group = db.session.get(PegGroup, participant.group_id) if participant.group_id else None
    if participant.mode != 'course':
        participant.course_id = participant.group_id = None
    elif course:
        participant.requested_cohort = course.cohort
    PegLeader.query.filter_by(user_id=participant.user_id).filter(
        PegLeader.group_id != participant.group_id if participant.group_id else True).delete(synchronize_session=False)
    board = CardState.query.filter_by(user_id=participant.user_id).order_by(CardState.id.desc()).first()
    if board:
        board.course_id = participant.course_id if participant.mode == 'course' else None
        board.cohort = (course.cohort if course else participant.requested_cohort) if participant.mode == 'course' else ''
        board.peg = (group.name if group else participant.requested_peg) if participant.mode == 'course' else ''


def participation_data(user_id=None):
    p = db.session.get(Participation, user_id or current_user.id)
    course = db.session.get(Course, p.course_id) if p and p.course_id else None
    group = db.session.get(PegGroup, p.group_id) if p and p.group_id else None
    return dict(mode=p.mode if p else 'personal', gender=p.gender if p else 'unspecified',
        courseId=p.course_id if p else None, groupId=p.group_id if p else None,
        cohort=(course.cohort if course else p.requested_cohort) if p and p.mode == 'course' else '',
        peg=(group.name if group else p.requested_peg) if p and p.mode == 'course' else '',
        assigned=bool(group))


@course_api.get('/participation')
@login_required
def participation_get():
    groups = PegGroup.query.order_by(PegGroup.name).all()
    response = jsonify(participation=participation_data(), csrf=csrf_token(),
        courses=[dict(id=c.id,name=c.name,cohort=c.cohort) for c in Course.query.order_by(Course.name).all()],
        groups=[dict(id=g.id,courseId=g.course_id,name=g.name,policy=g.policy) for g in groups])
    response.headers['Cache-Control'] = 'private, no-store'
    return response


@course_api.post('/participation')
@login_required
def participation_save():
    data = payload()
    mode, gender = data.get('mode'), data.get('gender', 'unspecified')
    if mode not in {'personal','course'} or gender not in {'woman','man','unspecified'}:
        abort(400, description='Choose Personal or Course and a valid gender option.')
    p = db.session.get(Participation, current_user.id)
    if not p:
        p = Participation(user_id=current_user.id)
        db.session.add(p)
    p.mode, p.gender = mode, gender
    message = 'Personal participation saved.'
    if mode == 'course':
        cohort, peg = cohort_name(data.get('cohort', '')), peg_name(data.get('peg', ''))
        if not cohort:
            abort(400, description='Enter or select the cohort for your course.')
        course = Course.query.filter_by(cohort_key=cohort.casefold()).first()
        p.requested_cohort, p.requested_peg = cohort, peg
        p.course_id, p.group_id = (course.id if course else None), None
        message = 'Course registration saved. An admin can assign your PEG.'
        if course and peg:
            group = PegGroup.query.filter_by(course_id=course.id,name_key=peg.casefold()).with_for_update().first()
            if group:
                reason = try_group(p, group)
                message = reason + ' An admin can help with placement.' if reason else 'Course registration saved and matched to your PEG.'
    else:
        p.course_id = p.group_id = None
        p.requested_cohort = p.requested_peg = ''
    sync_membership(p)
    db.session.commit()
    return jsonify(participation=participation_data(), message=message)


def management_data():
    groups = PegGroup.query.order_by(PegGroup.name).all()
    participants = Participation.query.filter_by(mode='course').all()
    users = {u.id:u for u in User.query.filter(User.id.in_([p.user_id for p in participants])).all()}
    leaders = PegLeader.query.all()
    return dict(csrf=csrf_token(), nextCohort=max([18]+[int(re.search(r'\d+',c.cohort)[0]) for c in Course.query.all() if re.fullmatch(r'Cohort \d+',c.cohort)])+1, courses=[dict(id=c.id,name=c.name,cohort=c.cohort) for c in Course.query.order_by(Course.name).all()],
        groups=[dict(id=g.id,courseId=g.course_id,name=g.name,policy=g.policy,minimum=g.minimum,maximum=g.maximum,
            members=[p.user_id for p in participants if p.group_id==g.id],
            leaders=[dict(id=l.user_id,email=users[l.user_id].email) for l in leaders if l.group_id==g.id and l.user_id in users]) for g in groups],
        members=[dict(id=p.user_id,name=users[p.user_id].name or users[p.user_id].email,email=users[p.user_id].email,
            courseId=p.course_id,groupId=p.group_id,gender=p.gender,cohort=p.requested_cohort,peg=p.requested_peg) for p in participants if p.user_id in users])


@course_api.get('/management')
@admin_route
def management():
    response=jsonify(management_data())
    response.headers['Cache-Control']='private, no-store'
    return response


@course_api.post('')
@admin_route
def create_course():
    data=payload()
    name,cohort=text(data.get('name','')),cohort_name(data.get('cohort',''))
    if not name or not cohort:
        abort(400, description='Course name and cohort are required.')
    course=Course(name=name,cohort=cohort,cohort_key=cohort.casefold())
    db.session.add(course)
    try:
        db.session.flush()
        # Match pending course registrations only. Personal users are excluded.
        for p in Participation.query.filter_by(mode='course',course_id=None).all():
            if p.requested_cohort.casefold()==course.cohort_key:
                p.course_id=course.id
                sync_membership(p)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(409,description='That cohort already exists.')
    return jsonify(id=course.id),201


@course_api.post('/<int:course_id>/groups')
@admin_route
def create_group(course_id):
    data=payload()
    course=db.session.get(Course,course_id)
    if not course:abort(404)
    minimum,maximum,policy=group_rules(data)
    name=peg_name(data.get('name',''))
    if not name:abort(400,description='Enter a PEG name or number.')
    group=PegGroup(course_id=course.id,name=name,name_key=name.casefold(),minimum=minimum,maximum=maximum,policy=policy)
    db.session.add(group)
    try:
        db.session.flush()
        for p in Participation.query.filter_by(mode='course',course_id=course.id,group_id=None).order_by(Participation.user_id).all():
            if p.requested_peg.casefold()==group.name_key:
                try_group(p,group)
                sync_membership(p)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(409,description='A PEG with that name already exists in this course.')
    return jsonify(id=group.id),201


@course_api.post('/<int:course_id>/assign')
@admin_route
def assign(course_id):
    data=payload()
    course=db.session.get(Course,course_id)
    group=db.session.get(PegGroup,data.get('groupId')) if isinstance(data.get('groupId'),int) else None
    user=User.query.filter(func.lower(User.email)==str(data.get('email','')).strip().lower()).first()
    if not course or not user:abort(404,description='Course or registered email not found.')
    if group and group.course_id!=course.id:abort(400,description='Choose a PEG in this course.')
    if data.get('groupId') is not None and not group:abort(400,description='Choose a valid PEG.')
    p=db.session.get(Participation,user.id)
    if not p or p.mode!='course':abort(409,description='This person uses Personal mode. They must register for a course first.')
    p.course_id=course.id
    p.group_id=None
    if group:try_group(p,group,strict=True)
    else:p.requested_peg=''
    sync_membership(p)
    db.session.commit()
    return jsonify(message='Course member assignment saved.')


@course_api.post('/groups/<int:group_id>/leaders')
@admin_route
def appoint_leader(group_id):
    data=payload()
    group=db.session.get(PegGroup,group_id)
    user=User.query.filter(func.lower(User.email)==str(data.get('email','')).strip().lower()).first()
    if not group or not user:abort(404,description='PEG or registered email not found.')
    leader=PegLeader.query.filter_by(group_id=group.id,user_id=user.id).first()
    if data.get('action')=='remove':
        if leader:db.session.delete(leader)
    else:
        p=db.session.get(Participation,user.id)
        if not p or p.mode!='course' or p.group_id!=group.id:abort(409,description='Assign this course member to the PEG before making them a leader.')
        if not leader:db.session.add(PegLeader(group_id=group.id,user_id=user.id))
    db.session.commit()
    return jsonify(message='PEG leader access updated.')


def random_groups(member_ids, minimum, maximum):
    count=math.ceil(len(member_ids)/maximum)
    if not count or len(member_ids)<count*minimum:
        raise ValueError('The available members cannot form groups within these minimum and maximum sizes.')
    shuffled=list(member_ids)
    secrets.SystemRandom().shuffle(shuffled)
    return [shuffled[i::count] for i in range(count)]


def eligible_members(course_id,policy):
    return [p.user_id for p in Participation.query.filter_by(mode='course',course_id=course_id,group_id=None).order_by(Participation.user_id).all() if gender_allowed(p,policy)]


def signer():
    return URLSafeTimedSerializer(current_app.secret_key,salt='peg-allocation-v1')


@course_api.post('/<int:course_id>/random-preview')
@admin_route
def random_preview(course_id):
    data=payload()
    if not db.session.get(Course,course_id):abort(404)
    minimum,maximum,policy=group_rules(data)
    ids=eligible_members(course_id,policy)
    try:groups=random_groups(ids,minimum,maximum)
    except ValueError as e:abort(409,description=str(e))
    plan=dict(admin=current_user.id,courseId=course_id,minimum=minimum,maximum=maximum,policy=policy,groups=groups)
    names={u.id:u.name or u.email for u in User.query.filter(User.id.in_(ids)).all()}
    return jsonify(token=signer().dumps(plan),groups=[[dict(id=i,name=names[i]) for i in g] for g in groups],
                   count=len(ids),remaining=Participation.query.filter_by(mode='course',course_id=course_id,group_id=None).count()-len(ids))


@course_api.post('/<int:course_id>/random-apply')
@admin_route
def random_apply(course_id):
    data=payload()
    try:plan=signer().loads(data.get('token',''),max_age=600)
    except (BadSignature, TypeError):abort(409,description='This preview expired. Generate another preview.')
    if plan['admin']!=current_user.id or plan['courseId']!=course_id:abort(403)
    Course.query.filter_by(id=course_id).with_for_update().first_or_404()
    expected=sorted(i for group in plan['groups'] for i in group)
    if expected!=eligible_members(course_id,plan['policy']):abort(409,description='The course roster changed. Generate another preview.')
    existing={g.name_key for g in PegGroup.query.filter_by(course_id=course_id)}
    n=max([0]+[int(name.split()[-1]) for name in existing if re.fullmatch(r'peg \d+',name)])+1
    for ids in plan['groups']:
        while f'peg {n}' in existing:n+=1
        group=PegGroup(course_id=course_id,name=f'PEG {n}',name_key=f'peg {n}',policy=plan['policy'],minimum=plan['minimum'],maximum=plan['maximum'])
        db.session.add(group);db.session.flush();existing.add(group.name_key)
        result=db.session.execute(update(Participation).where(Participation.user_id.in_(ids),Participation.mode=='course',Participation.course_id==course_id,Participation.group_id.is_(None)).values(group_id=group.id,requested_peg=group.name))
        if result.rowcount!=len(ids):
            db.session.rollback();abort(409,description='A member was assigned elsewhere. Generate another preview.')
        for p in Participation.query.filter(Participation.user_id.in_(ids)).all():sync_membership(p)
    db.session.commit()
    return jsonify(message=f"Created {len(plan['groups'])} PEG groups.")


@course_api.get('/admins')
@admin_route
def admin_access_list():
    from routes import configured_admin_emails
    from models import OverallAdmin, AdminAccessEvent
    from sqlalchemy import or_
    owners=configured_admin_emails()
    grants=OverallAdmin.query.all()
    events=AdminAccessEvent.query.order_by(AdminAccessEvent.id.desc()).limit(25).all()
    ids={g.user_id for g in grants}|{g.granted_by_id for g in grants}|{e.actor_id for e in events}|{e.target_id for e in events}
    users=User.query.filter(or_(func.lower(User.email).in_(owners),User.id.in_(ids))).all()
    by_id={u.id:u for u in users}
    by_email={u.email.casefold():u for u in users}
    admins=[]
    for email in sorted(owners):
        user=by_email.get(email)
        admins.append(dict(email=email,name=user.name if user else 'Configured owner',protected=True,
                           current=bool(user and user.id==current_user.id),grantedAt=None))
    for grant in grants:
        user=by_id.get(grant.user_id)
        if user and user.email.casefold() not in owners:
            admins.append(dict(email=user.email,name=user.name or user.email,protected=False,
                               current=user.id==current_user.id,grantedAt=grant.granted_at))
    response=jsonify(csrf=csrf_token(),admins=admins,activity=[dict(
        actor=by_id[e.actor_id].email if e.actor_id in by_id else 'Former admin',
        target=by_id[e.target_id].email if e.target_id in by_id else 'Former member',
        action=e.action,at=e.occurred_at) for e in events])
    response.headers['Cache-Control']='private, no-store'
    return response


@course_api.post('/admins')
@admin_route
def admin_access_change():
    from datetime import datetime, timezone
    from routes import configured_admin_emails
    from models import OverallAdmin, AdminAccessEvent
    data=payload()
    email=str(data.get('email','')).strip().casefold()
    action=data.get('action')
    if action not in {'grant','revoke'}:
        abort(400,description='Choose add or remove admin access.')
    user=User.query.filter(func.lower(User.email)==email).first()
    if not user:
        abort(404,description='This email is not registered. Ask the person to sign in once before adding them as an admin.')
    grant=db.session.get(OverallAdmin,user.id)
    owners=configured_admin_emails()
    if action=='revoke':
        if user.email.casefold() in owners:
            abort(409,description='Configured owners cannot be removed through this interface.')
        if user.id==current_user.id:
            abort(409,description='Ask another overall admin to remove your access.')
        if not grant:
            return jsonify(message='This person does not have overall admin access.')
        db.session.delete(grant)
    else:
        if grant or user.email.casefold() in owners:
            return jsonify(message='This person already has overall admin access.')
        grant=OverallAdmin(user_id=user.id,granted_by_id=current_user.id,granted_at=datetime.now(timezone.utc).isoformat())
        db.session.add(grant)
    db.session.add(AdminAccessEvent(actor_id=current_user.id,target_id=user.id,action=action,occurred_at=datetime.now(timezone.utc).isoformat()))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(409,description='Admin access changed in another session. Refresh and try again.')
    return jsonify(message=f'Overall admin access {"granted to" if action=="grant" else "removed from"} {user.email}.')
