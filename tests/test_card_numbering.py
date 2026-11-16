import os
import tempfile
import unittest

class CardNumberingTest(unittest.TestCase):
    def test_migration_preserves_progress_and_runs_once(self):
        with tempfile.TemporaryDirectory() as folder:
            os.environ['DATABASE_URL']='sqlite:///'+folder+'/numbering.db'
            from app import app
            from models import db, User, CardState, DailyLog, ArchivedCard, SessionEvaluation
            from card_numbering import migrate_card_numbering
            from sqlalchemy import text
            with app.app_context():
                db.session.add(User(id=990,google_id='numbering',email='numbering@example.test'))
                db.session.flush()
                board=CardState(user_id=990,current_card_id=7,round=2,active_instance_id='kept',commencing_date='2026-10-01')
                db.session.add(board);db.session.flush()
                db.session.add(DailyLog(card_state_id=board.id,day_number=1,morning_chapters=7))
                archive=ArchivedCard(user_id=990,instance_id='kept',card_id=7,round=2,total_score=33,
                    commencing_date='2026-10-01',saved_at='2026-10-28',snapshot_data={'currentCardId':7,'days':[{'dayNumber':1,'morningChapters':7}]})
                db.session.add(archive)
                evaluation=SessionEvaluation(user_id=990,session_number=7,diligence_1=True)
                db.session.add(evaluation);db.session.commit()
                db.session.execute(text("DELETE FROM app_data_migrations WHERE name='final_card_7_to_8_v1'"))
                migrate_card_numbering(db);db.session.commit()
                self.assertEqual(board.current_card_id,8)
                self.assertEqual(board.days[0].morning_chapters,7)
                self.assertEqual((archive.card_id,archive.total_score,archive.round,archive.instance_id),(8,33,2,'kept'))
                self.assertEqual(archive.snapshot_data['currentCardId'],8)
                self.assertEqual(evaluation.session_number,7)
                board.current_card_id=7;db.session.commit()
                migrate_card_numbering(db);db.session.commit()
                self.assertEqual(board.current_card_id,7)

                from card_numbering import apply_requested_card_label
                user=db.session.get(User,990)
                user.email='lennoxkahati@gmail.com'
                label_card=ArchivedCard(user_id=990,instance_id='label-only',card_id=2,round=1,total_score=18,
                    commencing_date='2026-06-08',saved_at='2026-07-01',snapshot_data={'currentCardId':2,'days':[{'dayNumber':1,'morningChapters':2}]})
                db.session.add(label_card);db.session.commit()
                apply_requested_card_label(db);db.session.commit()
                self.assertEqual(label_card.snapshot_data['displayCardNumber'],3)
                self.assertEqual((label_card.card_id,label_card.total_score,label_card.commencing_date),(2,18,'2026-06-08'))
                self.assertEqual(label_card.snapshot_data['days'][0]['morningChapters'],2)

                from card_numbering import REQUESTED_SEQUENCE, requested_card_label
                self.assertEqual(list(REQUESTED_SEQUENCE.values()),[3,4,5,6,7,8])
                other=User(name='Other',email='other@example.test',google_id='other-case')
                self.assertIsNone(requested_card_label(other,'2026-06-08'))
                self.assertIsNone(requested_card_label(user,'2026-06-08',2))
                for day,label in REQUESTED_SEQUENCE.items():
                    self.assertEqual(requested_card_label(user,day),label)
