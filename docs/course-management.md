# Courses and PEG leadership

Personal is the default. Existing cohort/PEG text does not enroll someone or give anyone leadership access.

## Join a course

In Account & Settings, choose Course under Personal or course participation. Enter the cohort number (currently Cohort 18) and a PEG number if known, then Save participation. Course participation shares the current card and evaluations with the course administrators and assigned PEG leaders. Personal journal and prayer text are excluded from reports.

Matching accepts `18` or `Cohort 18`, and `11` or `PEG 11`. The member joins an existing eligible group when it has room. Unknown cohorts and PEGs remain pending until the administrator creates or assigns them. Changing back to Personal removes PEG membership and PEG leader access without resetting reading progress.

## Administer courses

Owner administrators are configured by registered email through `ADMIN_EMAILS`. Additional overall admins are appointed through Overall admin access in the interface. In Member Progress, expand Courses & PEG groups. The initial course is Cohort 18; the next suggested cohort is 19, then 20, and so on. PEGs use numbered names such as PEG 11.

Create groups with minimum and maximum sizes and a group type: ladies only, men only, or mixed/any gender. Assign registered course members by email. Personal participants cannot be assigned. Gender is self-selected; unknown gender cannot be put in a ladies-only or men-only PEG.

Random placement uses only eligible, unassigned members of the selected course. Preview first, then apply. It never silently moves existing PEG members. Every generated group respects the chosen size limits; impossible combinations are rejected without changes. Previews expire after ten minutes and are rejected if the eligible roster changes.

## Appoint PEG leaders

Assign the member to a PEG first, then appoint them using their registered email. A PEG leader sees My PEG and may view progress and download records only for current members of their own PEG. Leaders cannot manage courses, appoint leaders, view personal participants or export other courses' records. Leaving or being moved out of a PEG revokes that PEG's leader access. Full administrators can remove leadership by email.

## Existing data

Startup creates the course/participation/group tables and adds a nullable course ID to active card states. It does not automatically enroll legacy personal accounts. Existing cards are retained. Course reports and leader exports include records tagged for the current course; untagged personal history is excluded.

## Add overall admins through the interface

In Member Progress, expand Overall admin access. Enter a registered email, select Add admin, and confirm the full-access grant. The person must have signed in once; course enrollment is not required for this role. Interface-appointed admins can administer all courses, groups, PEG leaders and other admins.

The admin list provides Remove access for other interface-appointed admins. Configured owner accounts in `ADMIN_EMAILS` are protected from removal through the interface, and admins cannot remove their own access. Removing overall admin access takes effect on the next request and does not remove a separate PEG leader assignment. Recent access changes record the acting admin, target account, action and date. Access grants and history are stored in database tables created automatically on startup.
