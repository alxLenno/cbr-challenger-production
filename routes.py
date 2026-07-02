import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from models import db, CardState, Weakness, DailyLog, WeekLog, ArchivedCard, SessionEvaluation

api_bp = Blueprint('api', __name__)

@api_bp.route('/state', methods=['GET'])
@login_required
def get_state():
    card_state = CardState.query.filter_by(user_id=current_user.id).order_by(CardState.id.desc()).first()
    
    if not card_state:
        return jsonify({"status": "no_active_card"}), 404

    state = {
        "username": current_user.name or current_user.email,
        "email": current_user.email,
        "profilePic": current_user.profile_pic or "",
        "contact": card_state.contact or "",
        "church": card_state.church or "",
        "currentCardId": card_state.current_card_id,
        "commencingDate": card_state.commencing_date,
        "theme": card_state.theme,
        "weaknesses": [
            {"name": w.name, "action": w.action} for w in card_state.weaknesses
        ],
        "days": [],
        "weeks": [],
        "savedCards": []
    }
    
    for d in card_state.days:
        state["days"].append({
            "dayNumber": d.day_number,
            "wakingTime": d.waking_time,
            "bibleBook": d.bible_book,
            "startChapter": d.start_chapter,
            "endChapter": d.end_chapter,
            "morningChapters": d.morning_chapters,
            "laterChapters": d.later_chapters,
            "recitedMemory": d.recited_memory,
            "fidJournaling": d.fid_journaling,
            "prayer10mins": d.prayer_10mins,
            "dataValidity": d.data_validity,
            "fidFocus": d.fid_focus,
            "fidInsight": d.fid_insight,
            "fidDoing": d.fid_doing,
            "scriptureMemorized": d.scripture_memorized,
            "prayerTopic": d.prayer_topic,
            "cbId": d.cb_id,
            "cbSolution": d.cb_solution,
            "cbScripture": d.cb_scripture,
            "cbResolved": d.cb_resolved,
            "logTimestamp": d.log_timestamp,
            "studyMethod": d.study_method,
            "openObservation": d.open_observation,
            "openPrinciples": d.open_principles,
            "openExperience": d.open_experience,
            "openNeed": d.open_need,
            "personsPersonal": d.persons_personal,
            "personsEnglish": d.persons_english,
            "personsReferences": d.persons_references,
            "personsSatan": d.persons_satan,
            "personsObedience": d.persons_obedience,
            "personsNote": d.persons_note,
            "personsStirring": d.persons_stirring
        })
    state["days"].sort(key=lambda x: x["dayNumber"])
    
    for w in card_state.weeks:
        state["weeks"].append({
            "weekNumber": w.week_number,
            "sharedFid": w.shared_fid
        })
    state["weeks"].sort(key=lambda x: x["weekNumber"])
    
    archives = ArchivedCard.query.filter_by(user_id=current_user.id).order_by(ArchivedCard.id.desc()).all()
    seen_cards = set()
    for arch in archives:
        snap = arch.snapshot_data
        c_id = snap.get("currentCardId") or snap.get("cardId") or arch.card_id or 1
        if c_id in seen_cards:
            continue
        seen_cards.add(c_id)
        if "currentCardId" not in snap:
            snap["currentCardId"] = c_id
        snap["instanceId"] = f"card_{c_id}"
        state["savedCards"].append(snap)
        
    return jsonify(state)

@api_bp.route('/save_state', methods=['POST'])
@login_required
def save_state():
    data = request.json
    
    card_state = CardState.query.filter_by(user_id=current_user.id).order_by(CardState.id.desc()).first()
    if not card_state:
        card_state = CardState(user_id=current_user.id)
        db.session.add(card_state)
    
    if data.get("username"):
        current_user.name = data.get("username")
    card_state.current_card_id = data.get("currentCardId", 1)
    card_state.commencing_date = data.get("commencingDate")
    card_state.theme = data.get("theme", "dark")
    card_state.contact = data.get("contact", "")
    card_state.church = data.get("church", "")
    
    Weakness.query.filter_by(card_state_id=card_state.id).delete()
    for w_data in data.get("weaknesses", []):
        w = Weakness(card_state_id=card_state.id, name=w_data.get("name"), action=w_data.get("action"))
        db.session.add(w)
        
    WeekLog.query.filter_by(card_state_id=card_state.id).delete()
    for w_data in data.get("weeks", []):
        w = WeekLog(card_state_id=card_state.id, week_number=w_data.get("weekNumber"), shared_fid=w_data.get("sharedFid"))
        db.session.add(w)
        
    DailyLog.query.filter_by(card_state_id=card_state.id).delete()
    for d_data in data.get("days", []):
        d = DailyLog(
            card_state_id=card_state.id,
            day_number=d_data.get("dayNumber"),
            waking_time=d_data.get("wakingTime"),
            bible_book=d_data.get("bibleBook"),
            start_chapter=d_data.get("startChapter", 0),
            end_chapter=d_data.get("endChapter", 0),
            morning_chapters=d_data.get("morningChapters", 0),
            later_chapters=d_data.get("laterChapters", 0),
            recited_memory=d_data.get("recitedMemory", False),
            fid_journaling=d_data.get("fidJournaling", False),
            prayer_10mins=d_data.get("prayer10mins", False),
            data_validity=d_data.get("dataValidity", False),
            fid_focus=d_data.get("fidFocus"),
            fid_insight=d_data.get("fidInsight"),
            fid_doing=d_data.get("fidDoing"),
            scripture_memorized=d_data.get("scriptureMemorized"),
            prayer_topic=d_data.get("prayerTopic"),
            cb_id=str(d_data.get("cbId", "")),
            cb_solution=d_data.get("cbSolution"),
            cb_scripture=d_data.get("cbScripture"),
            cb_resolved=d_data.get("cbResolved", False),
            log_timestamp=d_data.get("logTimestamp"),
            study_method=d_data.get("studyMethod", "FID"),
            open_observation=d_data.get("openObservation"),
            open_principles=d_data.get("openPrinciples"),
            open_experience=d_data.get("openExperience"),
            open_need=d_data.get("openNeed"),
            persons_personal=d_data.get("personsPersonal"),
            persons_english=d_data.get("personsEnglish"),
            persons_references=d_data.get("personsReferences"),
            persons_satan=d_data.get("personsSatan"),
            persons_obedience=d_data.get("personsObedience"),
            persons_note=d_data.get("personsNote"),
            persons_stirring=d_data.get("personsStirring")
        )
        db.session.add(d)
        
    db.session.commit()
    return jsonify({"status": "success"})

@api_bp.route('/archive', methods=['POST'])
@login_required
def archive_card():
    data = request.json
    c_id = data.get("currentCardId") or data.get("cardId")
    inst_id = f"card_{c_id}" if c_id else data.get("instanceId")
    data["instanceId"] = inst_id
    if c_id:
        data["currentCardId"] = c_id
        data["cardId"] = c_id
        
    existing = ArchivedCard.query.filter_by(user_id=current_user.id, card_id=c_id).first() if c_id else None
    if not existing and inst_id:
        existing = ArchivedCard.query.filter_by(user_id=current_user.id, instance_id=inst_id).first()
        
    if existing:
        existing.instance_id = inst_id
        existing.commencing_date = data.get("commencingDate")
        existing.total_score = data.get("totalScore")
        existing.total_laxity = data.get("totalLaxity")
        existing.saved_at = data.get("savedAt")
        existing.snapshot_data = data
    else:
        arch = ArchivedCard(
            user_id=current_user.id,
            instance_id=inst_id,
            card_id=c_id,
            commencing_date=data.get("commencingDate"),
            total_score=data.get("totalScore"),
            total_laxity=data.get("totalLaxity"),
            saved_at=data.get("savedAt"),
            snapshot_data=data
        )
        db.session.add(arch)
    db.session.commit()
    return jsonify({"status": "success"})

@api_bp.route('/archive/<instance_id>', methods=['DELETE'])
@login_required
def delete_archived_card(instance_id):
    if instance_id.startswith("card_"):
        parts = instance_id.split("_")
        if len(parts) >= 2 and parts[1].isdigit():
            c_id = int(parts[1])
            ArchivedCard.query.filter_by(user_id=current_user.id, card_id=c_id).delete()
    ArchivedCard.query.filter_by(user_id=current_user.id, instance_id=instance_id).delete()
    db.session.commit()
    return jsonify({"status": "success"})

@api_bp.route('/leaderboard', methods=['GET'])
@login_required
def get_leaderboard():
    from models import User
    
    # Target configurations based on card ID
    CARD_TARGETS = {
        1: {"chapters": 1, "ert": 5.75},   # 05:45 = 5.75
        2: {"chapters": 2, "ert": 5.5},    # 05:30 = 5.5
        3: {"chapters": 3, "ert": 5.25},   # 05:15 = 5.25
        4: {"chapters": 4, "ert": 5.0},    # 05:00 = 5.0
        5: {"chapters": 5, "ert": 4.75},   # 04:45 = 4.75
        6: {"chapters": 6, "ert": 4.5},    # 04:30 = 4.5
        7: {"chapters": 7, "ert": 4.0},    # 04:00 = 4.0
    }
    
    def time_to_decimal(t_str):
        if not t_str: return None
        parts = t_str.split(':')
        if len(parts) < 2: return None
        try:
            return int(parts[0]) + (int(parts[1]) / 60.0)
        except:
            return None
            
    users = User.query.all()
    leaderboard = []
    
    for u in users:
        # Get latest active card state
        c_state = CardState.query.filter_by(user_id=u.id).order_by(CardState.id.desc()).first()
        if not c_state: continue
        
        c_id = c_state.current_card_id or 1
        targets = CARD_TARGETS.get(c_id, CARD_TARGETS[1])
        target_chap = targets["chapters"]
        target_ert = targets["ert"]
        
        total_score = 0
        total_laxity = 0
        
        weeks_map = {w.week_number: w.shared_fid for w in c_state.weeks}
        days = sorted(c_state.days, key=lambda d: d.day_number)
        
        redeemed_cb_ids = set()
        max_week = 0
        if c_state.weeks:
            max_week = max(w.week_number for w in c_state.weeks)
            
        for w in range(max_week):
            week_idx = w + 1
            start_idx = w * 7
            week_days = days[start_idx:start_idx+7]
            
            p_count = 0
            c_count = 0
            pr_count = 0
            sm_count = 0
            m_count = 0
            
            for d in week_days:
                d_chap = (d.morning_chapters or 0) + (d.later_chapters or 0)
                d_ert = time_to_decimal(d.waking_time)
                
                chap_met = d_chap >= target_chap
                if not chap_met and d.cb_id and d.cb_resolved:
                    if d.cb_id not in redeemed_cb_ids:
                        chap_met = True
                        redeemed_cb_ids.add(d.cb_id)
                        
                if chap_met: p_count += 1
                if d_ert is not None and d_ert <= target_ert: c_count += 1
                if d.prayer_10mins: pr_count += 1
                if d.recited_memory: sm_count += 1
                if d.fid_journaling: m_count += 1
                
            w_score = 0
            if p_count == 7: w_score += 3
            if c_count == 7: w_score += 2
            if pr_count == 7: w_score += 2
            if sm_count == 7: w_score += 1
            if m_count == 7: w_score += 1
            if weeks_map.get(week_idx): w_score += 1
            
            total_score += w_score
            total_laxity += (10 - w_score)
            
        leaderboard.append({
            "id": u.id,
            "name": u.name or u.email.split('@')[0],
            "avatar": u.profile_pic,
            "cardLevel": c_id,
            "points": total_score,
            "laxity": total_laxity
        })
        
    leaderboard.sort(key=lambda x: (-x["points"], x["laxity"]))
    
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
        
    return jsonify({"leaderboard": leaderboard})


# ─── SESSION EVALUATION ROUTES ─────────────────────────────────────────────

@api_bp.route('/session_eval', methods=['GET'])
@login_required
def get_session_evals():
    """Return all session evaluations for the current user."""
    evals = SessionEvaluation.query.filter_by(user_id=current_user.id).all()
    result = {}
    for e in evals:
        diligence_score = sum([
            10 if e.diligence_1 else 0,
            10 if e.diligence_2 else 0,
            10 if e.diligence_3 else 0,
            10 if e.diligence_4 else 0,
            10 if e.diligence_5 else 0,
            10 if e.diligence_6 else 0,
        ])
        bonus_score = sum([
            50 if e.bonus_7  else 0,
            50 if e.bonus_8  else 0,
            50 if e.bonus_9  else 0,
            50 if e.bonus_10 else 0,
            50 if e.bonus_11 else 0,
            50 if e.bonus_12 else 0,
        ])
        result[e.session_number] = {
            "sessionNumber": e.session_number,
            "diligence": {
                "1": e.diligence_1, "2": e.diligence_2, "3": e.diligence_3,
                "4": e.diligence_4, "5": e.diligence_5, "6": e.diligence_6
            },
            "growthPoints": e.growth_points,
            "bonus": {
                "7": e.bonus_7,  "8": e.bonus_8,  "9": e.bonus_9,
                "10": e.bonus_10, "11": e.bonus_11, "12": e.bonus_12
            },
            "diligenceScore": diligence_score,
            "bonusScore": bonus_score,
            "totalPoints": diligence_score + e.growth_points + bonus_score,
            "submittedAt": e.submitted_at
        }
    return jsonify({"sessions": result})


@api_bp.route('/session_eval', methods=['POST'])
@login_required
def save_session_eval():
    """Save or update a session evaluation."""
    data = request.json
    session_num = data.get('sessionNumber')
    if not session_num or not (1 <= session_num <= 7):
        return jsonify({"error": "Invalid session number"}), 400

    ev = SessionEvaluation.query.filter_by(
        user_id=current_user.id, session_number=session_num
    ).first()

    if not ev:
        ev = SessionEvaluation(user_id=current_user.id, session_number=session_num)
        db.session.add(ev)

    d = data.get('diligence', {})
    ev.diligence_1 = bool(d.get('1', False))
    ev.diligence_2 = bool(d.get('2', False))
    ev.diligence_3 = bool(d.get('3', False))
    ev.diligence_4 = bool(d.get('4', False))
    ev.diligence_5 = bool(d.get('5', False))
    ev.diligence_6 = bool(d.get('6', False))

    ev.growth_points = int(data.get('growthPoints', 0))

    b = data.get('bonus', {})
    ev.bonus_7  = bool(b.get('7',  False))
    ev.bonus_8  = bool(b.get('8',  False))
    ev.bonus_9  = bool(b.get('9',  False))
    ev.bonus_10 = bool(b.get('10', False))
    ev.bonus_11 = bool(b.get('11', False))
    ev.bonus_12 = bool(b.get('12', False))

    ev.submitted_at = datetime.utcnow().isoformat()
    db.session.commit()
    return jsonify({"status": "success"})

