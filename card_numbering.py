"""One-time relabel of the former final card; session evaluation keys stay 1–7."""
from sqlalchemy import text

def migrate_card_numbering(db):
    db.session.execute(text('CREATE TABLE IF NOT EXISTS app_data_migrations (name VARCHAR(100) PRIMARY KEY)'))
    key='final_card_7_to_8_v1'
    if db.session.execute(text('SELECT name FROM app_data_migrations WHERE name=:name'),{'name':key}).first():
        return
    from models import CardState, ArchivedCard
    # Preserve instance IDs, rounds, log relationships and stored scores.
    for board in CardState.query.filter_by(current_card_id=7).all():
        board.current_card_id=8
    for archive in ArchivedCard.query.filter_by(card_id=7).all():
        archive.card_id=8
        snapshot=dict(archive.snapshot_data or {})
        snapshot.update(currentCardId=8,cardId=8)
        archive.snapshot_data=snapshot
    db.session.execute(text('INSERT INTO app_data_migrations (name) VALUES (:name)'),{'name':key})


REQUESTED_SEQUENCE = {
    '2026-06-08': 3, '2026-07-06': 4, '2026-08-03': 5,
    '2026-08-31': 6, '2026-09-28': 7, '2026-10-26': 8,
}


def requested_card_label(user, date, round_number=1):
    if (user.email or '').casefold() == 'lennoxkahati@gmail.com' and int(round_number or 1) == 1:
        return REQUESTED_SEQUENCE.get(date)
    return None


def apply_requested_card_label(db):
    """Relabel this member's six dated records, without changing scoring levels."""
    from models import User, ArchivedCard
    user = User.query.filter_by(email='lennoxkahati@gmail.com').first()
    if not user:
        return
    for archive in ArchivedCard.query.filter_by(user_id=user.id).all():
        label=requested_card_label(user,archive.commencing_date,archive.round)
        if label:
            snapshot=dict(archive.snapshot_data or {})
            snapshot['displayCardNumber']=label
            archive.snapshot_data=snapshot
