import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from models import db, CardState, Weakness, DailyLog, WeekLog, ArchivedCard

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

