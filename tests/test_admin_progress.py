import os
import tempfile
import unittest
from unittest.mock import patch


class AdminProgressTest(unittest.TestCase):
    def test_permissions_and_member_progress(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {
                'DATABASE_URL': 'sqlite:///' + folder + '/admin.db', 'ADMIN_EMAILS': 'admin.progress@example.test'}):
            from app import app
            from models import CardState, DailyLog, User, db, Course, Participation
            client = app.test_client()
            with app.app_context():
                admin = User(name='Progress Admin', email='admin.progress@example.test', google_id='progress-admin')
                member = User(name='Sample Member', email='member.progress@example.test', google_id='progress-user')
                db.session.add_all([admin, member])
                db.session.flush()
                aid, mid = admin.id, member.id
                course = Course.query.first()
                db.session.add(Participation(user_id=mid,mode='course',course_id=course.id,requested_cohort='Cohort 18',requested_peg='PEG 3'))
                board = CardState(course_id=course.id,user_id=mid, commencing_date='2026-11-02', cohort='November group', peg='PEG 3')
                db.session.add(board)
                db.session.flush()
                db.session.add_all([DailyLog(card_state_id=board.id, day_number=1, morning_chapters=3),
                                    DailyLog(card_state_id=board.id, day_number=2)])
                db.session.commit()
            self.assertEqual(client.get('/admin/progress').status_code, 302)
            with client.session_transaction() as session:
                session['_user_id'] = str(mid)
            self.assertEqual(client.get('/admin/progress').status_code, 403)
            self.assertNotIn(b'data-tab="tab-admin-progress"', client.get('/').data)
            self.assertEqual(client.get(f'/admin/api/members/{aid}/progress').status_code, 403)
            with client.session_transaction() as session:
                session['_user_id'] = str(aid)
            self.assertIn(b'data-tab="tab-admin-progress"', client.get('/').data)
            response = client.get('/admin/progress', follow_redirects=True)
            self.assertEqual(response.status_code, 200)
            for text in [b'Sample Member', b'Cohort 18', b'1 / 28']:
                self.assertIn(text, response.data)
            self.assertIn('no-store', response.headers['Cache-Control'])
            report = client.get(f'/admin/api/members/{mid}/progress')
            self.assertEqual(report.status_code, 200)
            self.assertEqual(report.json['member']['id'], mid)
            self.assertEqual(report.json['member']['chapters'], 3)
            self.assertIn('no-store', report.headers['Cache-Control'])
            self.assertEqual(client.get('/admin/api/members/999999/progress').status_code, 404)
            self.assertIn(b'id="main-header"', response.data)
            self.assertIn(b'id="theme-toggle"', response.data)
            self.assertIn(b'class="tab-content active" id="tab-admin-progress"', response.data)
            self.assertNotIn(b'class="tab-content active" id="tab-today"', response.data)

    def test_scoring_totals_and_export_privacy(self):
        from admin_progress import member_report
        from types import SimpleNamespace as NS
        from datetime import date
        user = NS(id=12, name='<Sample Member>', email='sample@example.test')
        days = [NS(day_number=i, waking_time='05:00', bible_book='John', start_chapter=1, end_chapter=1,
                   reading_passages=[], morning_chapters=1, later_chapters=0, recited_memory=True,
                   fid_journaling=True, prayer_10mins=True, data_validity=True, cb_id='', cb_resolved=False,
                   log_timestamp='2026-11-09T08:00:00', fid_focus='PRIVATE JOURNAL') for i in range(1,8)]
        board = NS(active_instance_id='live', current_card_id=1, round=2, commencing_date='2026-11-03',
                   contact='123', church='Church', cohort='November', peg='8', days=days,
                   weeks=[NS(week_number=1,shared_fid=True)])
        archives = [NS(id=1, instance_id='live', card_id=1, round=2, commencing_date='2026-11-03',
                       saved_at='2026-11-09', snapshot_data={'totalScore':999,'fidFocus':'PRIVATE JOURNAL'}),
                    NS(id=2,instance_id='old',card_id=1,round=1,commencing_date='2026-10-01',saved_at='2026-10-28',
                       snapshot_data={'totalScore':999,'days':[], 'weeks':[{'weekNumber':1,'sharedFid':True}]})]
        evaluations = [NS(session_number=1, submitted_at='2026-11-09', **{f'diligence_{i}':True for i in range(1,7)}, **{f'bonus_{i}':False for i in range(7,13)}),
                       NS(session_number=7, submitted_at=None, **{f'diligence_{i}':False for i in range(1,7)}, **{f'bonus_{i}':i==7 for i in range(7,13)})]
        report = member_report(user,board,archives,evaluations,today=date(2026,11,10))
        m=report['member']
        self.assertEqual(m['growthPoints'],11)
        self.assertEqual(m['totalPoints'],121)
        self.assertEqual(m['currentPoints'],10)
        self.assertEqual(m['days'],7)
        self.assertEqual(m['missed'],0)
        self.assertEqual(len(report['records']),2)
        self.assertNotIn('PRIVATE JOURNAL',str(report))
        self.assertTrue(report['state']['adminExport'])
        self.assertEqual(report['records'][0]['round'],1)
        self.assertEqual(report['records'][1]['round'],2)

    def test_future_days_and_inactivity_flags(self):
        from admin_progress import member_report
        from types import SimpleNamespace as NS
        from datetime import date
        user=NS(id=1,name='New',email='new@example.test')
        board=NS(active_instance_id='new', current_card_id=1,round=1,commencing_date='2026-11-20',
                 contact='',church='',cohort='',peg='',days=[],weeks=[])
        report=member_report(user,board,[],[],today=date(2026,11,10))
        self.assertEqual(report['member']['missed'],0)
        self.assertEqual(report['member']['status'],'Not started')
