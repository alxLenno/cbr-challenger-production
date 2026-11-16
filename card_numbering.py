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
