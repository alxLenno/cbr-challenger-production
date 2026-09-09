import os
import tempfile
import unittest
from datetime import date


class LeaderboardTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        os.environ['DATABASE_URL'] = 'sqlite:///' + cls.tmp.name + '/leaderboard.db'
        from app import app
        from models import db
        cls.app, cls.db = app, db
        app.config.update(TESTING=True)

    def test_totals_count_active_card_once_and_include_evaluations(self):
        from models import User, CardState, DailyLog, ArchivedCard, SessionEvaluation
        with self.app.app_context():
            user = User(google_id='lb-test', email='lb@example.test', name='Test')
            self.db.session.add(user)
            self.db.session.flush()
            uid = user.id
            state = CardState(user_id=uid, current_card_id=4, active_instance_id='active-test', commencing_date=date.today().isoformat())
            self.db.session.add(state)
            self.db.session.flush()
            for day in range(1, 8):
                self.db.session.add(DailyLog(card_state_id=state.id, day_number=day, morning_chapters=4))
            for instance, score in [('active-test', 3), ('prior-test', 16)]:
                self.db.session.add(ArchivedCard(user_id=uid, instance_id=instance, card_id=4 if instance == 'active-test' else 2, commencing_date='2026-01-01', saved_at='2026-01-01', total_score=score, total_laxity=0, snapshot_data={}))
            self.db.session.add(SessionEvaluation(user_id=uid, session_number=4, growth_points=999, **{f'diligence_{i}': True for i in range(1, 7)}))
            self.db.session.add(SessionEvaluation(user_id=uid, session_number=7, bonus_7=True))
            self.db.session.commit()
        client = self.app.test_client()
        with client.session_transaction() as session:
            session['_user_id'] = str(uid)
            session['_fresh'] = True
        response = client.get('/api/leaderboard')
        self.assertEqual(response.status_code, 200)
        row = next(r for r in response.json['leaderboard'] if r['id'] == uid)
        self.assertEqual(row['cumulative_points'], 129)  # 16 + 3 + 60 + 50
        self.assertEqual(row['session_points'], 63)
        self.assertEqual(row['daily_points'], 1)
        self.assertEqual(row['weekly_points'], 7)

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            cls.db.session.remove()
            cls.db.engine.dispose()
        cls.tmp.cleanup()


if __name__ == '__main__':
    unittest.main()
