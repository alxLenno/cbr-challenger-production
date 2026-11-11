import os
import tempfile
import unittest


class ThemeTest(unittest.TestCase):
    def test_server_renders_saved_theme_before_javascript(self):
        with tempfile.TemporaryDirectory() as folder:
            os.environ['DATABASE_URL']='sqlite:///'+folder+'/theme.db'
            from app import app
            from models import db,User,CardState
            app.config['TESTING']=True
            with app.app_context():
                user=User(name='Theme User',email='theme@example.test',google_id='theme-user')
                db.session.add(user);db.session.flush();uid=user.id
                board=CardState(user_id=uid,commencing_date='2026-11-10',theme='light')
                db.session.add(board);db.session.commit()
            client=app.test_client()
            with client.session_transaction() as session:session['_user_id']=str(uid)
            html=client.get('/').get_data(as_text=True)
            self.assertIn('<body class="light-mode">',html)
            self.assertIn(f'const key = "cbr.theme.{uid}"',html)
            self.assertLess(html.index('window.cbrTheme ='),html.index('rel="stylesheet"'))
            with app.app_context():
                board=CardState.query.filter_by(user_id=uid).first();board.theme='dark';db.session.commit()
            html=client.get('/').get_data(as_text=True)
            self.assertNotIn('<body class="light-mode">',html)
            self.assertIn('let value = "dark"',html)
            with app.app_context():db.session.remove();db.engine.dispose()
