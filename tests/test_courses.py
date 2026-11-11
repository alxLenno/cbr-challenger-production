import os
import tempfile
import unittest
from unittest.mock import patch


class CourseTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.env=patch.dict(os.environ,{'DATABASE_URL':'sqlite:///'+cls.temp.name+'/courses.db', 'ADMIN_EMAILS':'admin.course@example.test'})
        cls.env.start()
        from app import app
        from models import db
        cls.app,cls.db=app,db
        app.config['TESTING']=True

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            cls.db.session.remove(); cls.db.engine.dispose()
        cls.env.stop();cls.temp.cleanup()

    def setUp(self):
        from models import User,Course,db
        with self.app.app_context():
            db.drop_all();db.create_all()
            db.session.add(Course(name='CBR Course',cohort='Cohort 18',cohort_key='cohort 18'))
            for i,email in enumerate(['admin.course@example.test','woman@example.test','man@example.test','personal@example.test','other@example.test','unknown@example.test']):
                db.session.add(User(name=email.split('@')[0],email=email,google_id='course-'+str(i)))
            db.session.commit()
        self.admin=self.client(1);self.woman=self.client(2);self.man=self.client(3);self.personal=self.client(4)

    def client(self,uid):
        c=self.app.test_client()
        with c.session_transaction() as session:session['_user_id']=str(uid);session['_fresh']=True
        return c

    def post(self,client,path,data):
        token=client.get('/api/courses/participation').json['csrf']
        return client.post('/api/courses'+path,json=data,headers={'X-CSRF-Token':token})

    def enroll(self,client,gender='unspecified',peg='',cohort='18'):
        r=self.post(client,'/participation',dict(mode='course',gender=gender,cohort=cohort,peg=peg))
        self.assertEqual(r.status_code,200,r.json)
        return r

    def group(self,name='11',policy='mixed',minimum=1,maximum=3):
        r=self.post(self.admin,'/1/groups',dict(name=name,policy=policy,minimum=minimum,maximum=maximum))
        self.assertEqual(r.status_code,201,r.json)
        return r.json['id']

    def test_personal_default_csrf_and_course_numbering(self):
        self.assertEqual(self.personal.get('/api/courses/participation').json['participation']['mode'],'personal')
        self.assertEqual(self.personal.post('/api/courses/participation',json={'mode':'course'}).status_code,403)
        self.assertEqual(self.post(self.personal,'',{'name':'X','cohort':'19'}).status_code,403)
        self.assertEqual(self.admin.get('/api/courses/management').json['nextCohort'],19)
        r=self.post(self.admin,'',dict(name='CBR Course',cohort='19'))
        self.assertEqual(r.status_code,201)
        self.assertEqual(self.admin.get('/api/courses/management').json['nextCohort'],20)
        self.assertEqual(self.post(self.admin,'',dict(name='X',cohort='Cohort 19')).status_code,409)

    def test_auto_match_capacity_gender_and_personal_exclusion(self):
        gid=self.group(policy='women',maximum=1)
        self.enroll(self.woman,'woman','peg 11')
        self.assertEqual(self.woman.get('/api/courses/participation').json['participation']['groupId'],gid)
        self.enroll(self.man,'man','11')
        self.assertIsNone(self.man.get('/api/courses/participation').json['participation']['groupId'])
        self.enroll(self.client(5),'woman','11')
        self.assertIsNone(self.client(5).get('/api/courses/participation').json['participation']['groupId'])
        self.assertEqual(self.post(self.admin,'/1/assign',{'email':'personal@example.test','groupId':gid}).status_code,409)
        self.assertEqual(self.post(self.admin,'/1/assign',{'email':'man@example.test','groupId':gid}).status_code,409)
        members=self.admin.get('/api/courses/management').json['members']
        self.assertNotIn(4,[m['id'] for m in members])
        self.assertEqual(self.admin.get('/api/courses/management').json['groups'][0]['name'],'PEG 11')

    def test_pending_cohort_and_peg_match_when_admin_creates_them(self):
        self.enroll(self.woman,'woman','11','19')
        self.assertIsNone(self.woman.get('/api/courses/participation').json['participation']['courseId'])
        cid=self.post(self.admin,'',dict(name='CBR Course',cohort='Cohort 19')).json['id']
        gid=self.post(self.admin,f'/{cid}/groups',dict(name='PEG 11',policy='women',minimum=1,maximum=5)).json['id']
        self.assertEqual(self.woman.get('/api/courses/participation').json['participation']['groupId'],gid)

    def test_leader_access_is_scoped_and_revoked_when_leaving(self):
        first=self.group('11');second=self.group('12')
        self.enroll(self.woman,'woman','11');self.enroll(self.man,'man','12')
        self.enroll(self.client(5),'woman','11')
        r=self.post(self.admin,f'/groups/{first}/leaders',{'email':'WOMAN@example.test'})
        self.assertEqual(r.status_code,200)
        page=self.woman.get('/?admin=progress')
        self.assertEqual(page.status_code,200)
        self.assertIn(b'My PEG',page.data)
        self.assertIn(b'other@example.test',page.data)
        self.assertNotIn(b'>man@example.test<',page.data)
        self.assertNotIn(b'id="course-manager"',page.data)
        self.assertEqual(self.woman.get('/admin/api/members/5/progress').status_code,200)
        self.assertEqual(self.woman.get('/admin/api/members/3/progress').status_code,403)
        self.assertEqual(self.woman.get('/admin/api/members/4/progress').status_code,403)
        self.assertEqual(self.woman.get('/api/courses/management').status_code,403)
        leaderboard=self.woman.get('/api/leaderboard').json['leaderboard']
        self.assertEqual({m['id'] for m in leaderboard},{2,5})
        self.assertEqual(self.post(self.woman,f'/groups/{second}/leaders',{'email':'woman@example.test'}).status_code,403)
        self.post(self.woman,'/participation',{'mode':'personal','gender':'woman'})
        self.assertEqual(self.woman.get('/admin/api/members/5/progress').status_code,403)
        self.assertNotIn(b'My PEG',self.woman.get('/').data)

    def test_random_preview_apply_size_gender_and_stale_plan(self):
        self.enroll(self.woman,'woman');self.enroll(self.man,'man');self.enroll(self.client(5),'woman');self.enroll(self.client(6))
        impossible=self.post(self.admin,'/1/random-preview',dict(minimum=3,maximum=3,policy='mixed'))
        self.assertEqual(impossible.status_code,409)
        preview=self.post(self.admin,'/1/random-preview',dict(minimum=2,maximum=2,policy='women'))
        self.assertEqual(preview.status_code,200)
        self.assertEqual(sorted(m['id'] for g in preview.json['groups'] for m in g),[2,5])
        self.assertEqual(self.admin.get('/api/courses/management').json['groups'],[])
        applied=self.post(self.admin,'/1/random-apply',{'token':preview.json['token']})
        self.assertEqual(applied.status_code,200,applied.json)
        self.assertEqual(self.post(self.admin,'/1/random-apply',{'token':preview.json['token']}).status_code,409)
        groups=self.admin.get('/api/courses/management').json['groups']
        self.assertEqual(len(groups),1)
        self.assertEqual(len(groups[0]['members']),2)
        self.assertIsNone(self.man.get('/api/courses/participation').json['participation']['groupId'])
        self.assertEqual(self.post(self.admin,'/1/random-apply',{'token':'tampered'}).status_code,409)

    def test_random_grouping_balances_all_members_within_limits(self):
        from courses import random_groups
        for n,low,high in [(7,3,4),(15,4,6),(4,1,8),(100,7,10)]:
            groups=random_groups(list(range(n)),low,high)
            self.assertEqual(sorted(x for g in groups for x in g),list(range(n)))
            self.assertTrue(all(low<=len(g)<=high for g in groups))
        with self.assertRaises(ValueError):random_groups([],2,5)
        with self.assertRaises(ValueError):random_groups([1,2,3,4,5],3,4)

    def test_leader_cannot_export_personal_or_other_course_records(self):
        from models import CardState,DailyLog,ArchivedCard,db
        gid=self.group();self.enroll(self.woman,'woman','11');self.enroll(self.client(5),'woman','11')
        self.post(self.admin,f'/groups/{gid}/leaders',{'email':'woman@example.test'})
        with self.app.app_context():
            board=CardState(user_id=5,course_id=1,current_card_id=1,active_instance_id='current',commencing_date='2026-11-10')
            db.session.add(board);db.session.flush()
            db.session.add(DailyLog(card_state_id=board.id,day_number=1,morning_chapters=1,fid_focus='PRIVATE TEXT'))
            for instance,cid in [('personal-history',None),('different-course',2),('this-course',1)]:
                db.session.add(ArchivedCard(user_id=5,instance_id=instance,card_id=1,commencing_date='2026-10-01',saved_at='2026-10-28',snapshot_data={'courseId':cid,'days':[],'weeks':[]}))
            db.session.commit()
        report=self.woman.get('/admin/api/members/5/progress')
        self.assertEqual(report.status_code,200)
        ids=[c['instanceId'] for c in report.json['records']]
        self.assertEqual(set(ids),{'current','this-course'})
        self.assertNotIn('PRIVATE TEXT',report.get_data(as_text=True))

    def test_existing_database_migration_preserves_cards_and_personal_default(self):
        from flask import Flask
        from sqlalchemy import text, inspect
        from models import db, auto_migrate_db, Course, Participation
        legacy=Flask('course-migration-test')
        legacy.config['SQLALCHEMY_DATABASE_URI']='sqlite:///:memory:'
        db.init_app(legacy)
        with legacy.app_context():
            db.session.execute(text('CREATE TABLE card_states (id INTEGER PRIMARY KEY, user_id INTEGER, current_card_id INTEGER, commencing_date VARCHAR(20), theme VARCHAR(10), contact VARCHAR(120), church VARCHAR(120))'))
            db.session.execute(text("INSERT INTO card_states VALUES (1,7,3,'2026-11-01','dark','123','Church')"))
            db.session.commit()
        auto_migrate_db(legacy)
        with legacy.app_context():
            self.assertIn('course_id',[c['name'] for c in inspect(db.engine).get_columns('card_states')])
            row=db.session.execute(text('SELECT current_card_id, contact, course_id FROM card_states WHERE id=1')).first()
            self.assertEqual(tuple(row),(3,'123',None))
            self.assertEqual(Course.query.one().cohort,'Cohort 18')
            self.assertEqual(Participation.query.count(),0)
            db.session.remove();db.engine.dispose()

    def test_stale_card_save_cannot_change_course_membership_or_grant_roles(self):
        gid=self.group();self.enroll(self.woman,'woman','11')
        state=dict(username='Woman',currentCardId=1,activeInstanceId='my-card',commencingDate='2026-11-10',
                   cohort='Cohort 999',peg='PEG 999',courseId=999,isAdmin=True,days=[],weeks=[],savedCards=[],weaknesses=[])
        self.assertEqual(self.woman.post('/api/save_state',json=state).status_code,200)
        result=self.woman.get('/api/state').json
        self.assertEqual(result['courseId'],1)
        self.assertEqual(result['cohort'],'Cohort 18')
        self.assertEqual(result['peg'],'PEG 11')
        self.assertFalse(result['isAdmin'])
        self.assertEqual(result['savedCards'][0]['courseId'],1)
        self.assertEqual(self.woman.get('/api/courses/management').status_code,403)
        self.post(self.woman,'/participation',{'mode':'personal','gender':'woman'})
        self.woman.post('/api/save_state',json=state)
        result=self.woman.get('/api/state').json
        self.assertIsNone(result['courseId'])
        self.assertEqual(result['peg'],'')
        self.assertEqual(result['cohort'],'')

    def test_moving_a_leader_revokes_old_peg_access(self):
        first=self.group('11');second=self.group('12')
        self.enroll(self.woman,'woman','11');self.enroll(self.client(5),'woman','11')
        self.post(self.admin,f'/groups/{first}/leaders',{'email':'woman@example.test'})
        self.assertEqual(self.woman.get('/admin/api/members/5/progress').status_code,200)
        self.assertEqual(self.post(self.admin,'/1/assign',{'email':'woman@example.test','groupId':second}).status_code,200)
        self.assertEqual(self.woman.get('/admin/api/members/5/progress').status_code,403)
        self.assertNotIn(b'data-tab="tab-admin-progress"',self.woman.get('/').data)

    def test_switching_participation_preserves_existing_reading_data(self):
        from models import CardState,DailyLog,db
        with self.app.app_context():
            board=CardState(user_id=2,current_card_id=3,round=2,active_instance_id='preserved',commencing_date='2026-11-10')
            db.session.add(board);db.session.flush();board_id=board.id
            day=DailyLog(card_state_id=board.id,day_number=1,morning_chapters=3,fid_focus='My private reflection')
            db.session.add(day);db.session.commit();day_id=day.id
        self.group('11');self.enroll(self.woman,'woman','11')
        for mode in ['course','personal']:
            if mode=='personal':self.post(self.woman,'/participation',{'mode':'personal','gender':'woman'})
            with self.app.app_context():
                board=db.session.get(CardState,board_id);day=db.session.get(DailyLog,day_id)
                self.assertEqual((board.current_card_id,board.round,board.active_instance_id),(3,2,'preserved'))
                self.assertEqual(day.morning_chapters,3)
                self.assertEqual(day.fid_focus,'My private reflection')
                self.assertEqual(board.course_id,1 if mode=='course' else None)

    def test_overall_admin_grant_revoke_and_delegation(self):
        from models import db,OverallAdmin,AdminAccessEvent
        self.assertEqual(self.personal.get('/api/courses/admins').status_code,403)
        self.assertEqual(self.post(self.admin,'/admins',{'email':'PERSONAL@example.test','action':'grant'}).status_code,200)
        self.assertEqual(self.personal.get('/api/courses/management').status_code,200)
        self.assertTrue(self.personal.get('/api/state').json['isAdmin'])
        self.assertIn(b'id="overall-admin-manager"',self.personal.get('/?admin=progress').data)
        # New interface-appointed admins can appoint another registered admin.
        self.assertEqual(self.post(self.personal,'/admins',{'email':'other@example.test','action':'grant'}).status_code,200)
        self.assertEqual(self.client(5).get('/api/courses/management').status_code,200)
        # Repeated grants are idempotent and do not manufacture audit entries.
        self.assertEqual(self.post(self.admin,'/admins',{'email':'personal@example.test','action':'grant'}).status_code,200)
        self.assertEqual(self.post(self.personal,'/admins',{'email':'personal@example.test','action':'revoke'}).status_code,409)
        self.assertEqual(self.post(self.personal,'/admins',{'email':'admin.course@example.test','action':'revoke'}).status_code,409)
        self.assertEqual(self.post(self.admin,'/admins',{'email':'personal@example.test','action':'revoke'}).status_code,200)
        self.assertEqual(self.personal.get('/api/courses/admins').status_code,403)
        self.assertEqual(self.post(self.personal,'/admins',{'email':'personal@example.test','action':'grant'}).status_code,403)
        self.assertNotIn(b'id="overall-admin-manager"',self.personal.get('/').data)
        with self.app.app_context():
            self.assertIsNone(db.session.get(OverallAdmin,4))
            self.assertIsNotNone(db.session.get(OverallAdmin,5))
            self.assertEqual(AdminAccessEvent.query.count(),3)
        listing=self.admin.get('/api/courses/admins')
        self.assertIn('no-store',listing.headers['Cache-Control'])
        self.assertTrue(next(a for a in listing.json['admins'] if a['email']=='admin.course@example.test')['protected'])

    def test_admin_access_requires_owner_or_full_admin_and_csrf(self):
        from models import OverallAdmin,AdminAccessEvent
        gid=self.group();self.enroll(self.woman,'woman','11')
        self.post(self.admin,f'/groups/{gid}/leaders',{'email':'woman@example.test'})
        self.assertEqual(self.woman.get('/api/courses/admins').status_code,403)
        self.assertEqual(self.post(self.woman,'/admins',{'email':'woman@example.test','action':'grant'}).status_code,403)
        self.assertNotIn(b'id="overall-admin-manager"',self.woman.get('/?admin=progress').data)
        self.assertEqual(self.admin.post('/api/courses/admins',json={'email':'other@example.test','action':'grant'}).status_code,403)
        self.assertEqual(self.post(self.admin,'/admins',{'email':'not-registered@example.test','action':'grant'}).status_code,404)
        self.assertEqual(self.post(self.admin,'/admins',{'email':'other@example.test','action':'unknown'}).status_code,400)
        with self.app.app_context():
            self.assertEqual(OverallAdmin.query.count(),0)
            self.assertEqual(AdminAccessEvent.query.count(),0)

    def test_admin_revocation_preserves_separate_peg_leadership(self):
        gid=self.group();self.enroll(self.woman,'woman','11');self.enroll(self.man,'man','11')
        self.post(self.admin,f'/groups/{gid}/leaders',{'email':'woman@example.test'})
        self.post(self.admin,'/admins',{'email':'woman@example.test','action':'grant'})
        self.assertEqual(self.woman.get('/api/courses/management').status_code,200)
        self.post(self.admin,'/admins',{'email':'woman@example.test','action':'revoke'})
        self.assertEqual(self.woman.get('/api/courses/management').status_code,403)
        self.assertEqual(self.woman.get('/admin/api/members/3/progress').status_code,200)
        self.assertEqual(self.woman.get('/admin/api/members/5/progress').status_code,403)
        self.assertIn(b'My PEG',self.woman.get('/?admin=progress').data)

    def test_empty_course_leaderboard_explains_personal_default(self):
        response=self.admin.get('/api/leaderboard')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json['leaderboard'],[])
        self.assertEqual(response.json['context']['scope'],'courses')
        self.assertEqual(response.json['context']['emptyTitle'],'No course members yet')
        self.assertEqual(response.json['context']['action'],'manage')
        self.assertIn('no-store',response.headers['Cache-Control'])
        # An empty ranking does not enroll or alter any personal account.
        self.assertEqual(self.personal.get('/api/courses/participation').json['participation']['mode'],'personal')
        personal=self.personal.get('/api/leaderboard').json
        self.assertEqual(personal['context']['scope'],'personal')
        self.assertEqual([m['id'] for m in personal['leaderboard']],[4])

    def test_peg_leaderboard_excludes_personal_and_other_course_history(self):
        from models import CardState,ArchivedCard,db
        gid=self.group();self.enroll(self.woman,'woman','11');self.enroll(self.man,'man','11')
        self.post(self.admin,f'/groups/{gid}/leaders',{'email':'woman@example.test'})
        with self.app.app_context():
            db.session.add(CardState(user_id=3,course_id=1,current_card_id=1,active_instance_id='live-lb',commencing_date='2026-11-10'))
            for instance,cid,points in [('private',None,500),('elsewhere',2,300),('course',1,2)]:
                db.session.add(ArchivedCard(user_id=3,instance_id=instance,card_id=1,commencing_date='2026-10-01',saved_at='2026-10-28',total_score=points,total_laxity=0,snapshot_data={'courseId':cid}))
            db.session.commit()
        response=self.woman.get('/api/leaderboard').json
        self.assertEqual(response['context']['scope'],'peg')
        self.assertEqual(next(m['cumulative_points'] for m in response['leaderboard'] if m['id']==3),2)
