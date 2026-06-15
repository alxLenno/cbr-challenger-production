import re

with open('templates/index.html', 'r') as f:
    html = f.read()

# 1. Extract Early-Riser Chart
chart_pattern = re.compile(r'(<!-- Waking Time Early Riser Chart -->.*?</section>\n)', re.DOTALL)
chart_match = chart_pattern.search(html)
if not chart_match:
    print("Chart not found!")
    exit(1)
chart_html = chart_match.group(1)
html = html.replace(chart_html, '')

# 2. Extract Data Management Panel
settings_pattern = re.compile(r'(<!-- Data Management Panel -->.*?</section>\n)', re.DOTALL)
settings_match = settings_pattern.search(html)
if not settings_match:
    print("Settings not found!")
    exit(1)
settings_html = settings_match.group(1)
html = html.replace(settings_html, '')

# 3. Add Tab Buttons
tabs_header_end = '<button class="tab-btn" data-tab="tab-history">📁 Card History</button>'
new_tabs = tabs_header_end + '\n          <button class="tab-btn" data-tab="tab-chart">📈 Early-Riser Chart</button>\n          <button class="tab-btn" data-tab="tab-settings">⚙️ Settings & Backups</button>'
html = html.replace(tabs_header_end, new_tabs)

# 4. Add Tab Contents at the end of the sidebar
# Find the end of the last tab content (PERSONS or History)
history_tab_end = '<!-- Library section moved into History tab in sidebar -->\n      </aside>'

new_tab_contents = f"""<!-- Chart tab contents -->
        <div class="tab-content" id="tab-chart">
{chart_html}        </div>

        <!-- Settings tab contents -->
        <div class="tab-content" id="tab-settings">
{settings_html}        </div>

"""
html = html.replace('      </aside>', new_tab_contents + '      </aside>')

with open('templates/index.html', 'w') as f:
    f.write(html)

print("Modifications done.")
