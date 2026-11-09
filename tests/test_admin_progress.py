import os
import tempfile
import unittest
from unittest.mock import patch


class AdminProgressTest(unittest.TestCase):
    def test_permissions_and_member_progress(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {
                'DATABASE_URL': 'sqlite:///' + folder + '/admin.db', 'ADMIN_EMAILS': 'admin.progress@example.test'}):
            from app import app
            from models import CardState, DailyLog, User, db
            client = app.test_client()
            with app.app_context():
                admin = User(name='Progress Admin', email='admin.progress@example.test', google_id='progress-admin')
                member = User(name='Sample Member', email='member.progress@example.test', google_id='progress-user')
                db.session.add_all([admin, member])
                db.session.flush()
                aid, mid = admin.id, member.id
                board = CardState(user_id=mid, commencing_date='2026-11-02', cohort='November group', peg='PEG 3')
                db.session.add(board)
                db.session.flush()
                db.session.add_all([DailyLog(card_state_id=board.id, day_number=1, morning_chapters=3),
                                    DailyLog(card_state_id=board.id, day_number=2)])
                db.session.commit()
            self.assertEqual(client.get('/admin/progress').status_code, 302)
            with client.session_transaction() as session:
                session['_user_id'] = str(mid)
            self.assertEqual(client.get('/admin/progress').status_code, 403)
            self.assertNotIn(b'href="/admin/progress"', client.get('/').data)
            with client.session_transaction() as session:
                session['_user_id'] = str(aid)
            self.assertIn(b'href="/admin/progress"', client.get('/').data)
            response = client.get('/admin/progress')
            self.assertEqual(response.status_code, 200)
            for text in [b'Sample Member', b'November group', b'1 / 28', b'<td>3</td>', b'No card yet']:
                self.assertIn(text, response.data)
            self.assertIn('no-store', response.headers['Cache-Control'])
