import re

with open('templates/index.html', 'r') as f:
    html = f.read()

# 1. Add "Dashboard" tab button
dashboard_tab_btn = '<button class="tab-btn active" data-tab="tab-dashboard">🏠 Dashboard</button>\n          '
# Make sure we don't have multiple 'active' tabs in the header
tabs_header_pattern = re.compile(r'(<div class="tabs-header">.*?</div>)', re.DOTALL)
tabs_match = tabs_header_pattern.search(html)
if tabs_match:
    old_tabs = tabs_match.group(1)
    new_tabs = old_tabs.replace('class="tab-btn active"', 'class="tab-btn"')
    new_tabs = new_tabs.replace('<div class="tabs-header">\n          ', f'<div class="tabs-header">\n          {dashboard_tab_btn}')
    html = html.replace(old_tabs, new_tabs)

# 2. Wrap profile, KPIs, and calendar into tab-dashboard
# We will wrap everything from <!-- Collapsible Profile & Card Setup --> to the end of <!-- Weeks Grid ... -->
# Actually, it's easier to find the chunks and wrap them.

profile_kpi_pattern = re.compile(r'(<!-- Collapsible Profile & Card Setup -->.*?<!-- KPI Row -->.*?</section>\n)', re.DOTALL)
pk_match = profile_kpi_pattern.search(html)

calendar_pattern = re.compile(r'(<main class="main-layout">\n      <!-- Left Panel: Grid, Chart, and Scoring -->\n      <div class="left-column">\n        \n        <!-- Weeks Grid \(The Challenger Card Calendar\) -->\n        <section class="glass-panel grid-section" id="calendar-section">.*?</section>\n\n        \n        \n      </div>)', re.DOTALL)
cal_match = calendar_pattern.search(html)

if pk_match and cal_match:
    pk_html = pk_match.group(1)
    cal_html = cal_match.group(1)
    
    # We want to replace the `cal_html` with just `<div class="left-column">` (we keep the structure but move things around)
    # Actually, we can move the <main> and <left-column> wrappers to surround ALL tab contents.
    
    # First, remove pk_html from its original place
    html = html.replace(pk_html, '')
    
    # Now, find all tab-contents inside the sidebar
    tab_contents_pattern = re.compile(r'(<!-- Syllabus tab contents -->.*)      </aside>', re.DOTALL)
    tc_match = tab_contents_pattern.search(html)
    if tc_match:
        all_tab_contents = tc_match.group(1)
        # Remove them from the sidebar
        html = html.replace(all_tab_contents + '      </aside>', '      </aside>')
        
        # Build the new left-column content
        dashboard_content = f"""<!-- Dashboard tab contents -->
        <div class="tab-content active" id="tab-dashboard">
{pk_html}
        <!-- Weeks Grid (The Challenger Card Calendar) -->
{cal_match.group(1).split('<!-- Weeks Grid')[1].split('</section>')[0] + '</section>'}
        </div>
"""
        # Reconstruct the main layout
        new_cal_html = f"""<main class="main-layout">
      <!-- Left Panel: Main Content Area -->
      <div class="left-column">
{dashboard_content}
{all_tab_contents}
      </div>"""
        
        html = html.replace(cal_match.group(1), new_cal_html)

with open('templates/index.html', 'w') as f:
    f.write(html)

print("Restructuring done.")
