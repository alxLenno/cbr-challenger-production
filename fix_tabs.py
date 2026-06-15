import re
import subprocess

# get old index.html
old_html = subprocess.check_output(['git', 'show', 'HEAD:templates/index.html']).decode('utf-8')

# extract chart section
chart_match = re.search(r'<section class="glass-panel charts-section" id="charts-section">.*?</section>', old_html, re.DOTALL)
if chart_match:
    chart_html = chart_match.group(0)
else:
    print("Chart not found in old git")
    exit(1)

# fix the chart html to just be the content of the tab, no section tag needed
chart_content = chart_html.replace('<section class="glass-panel charts-section" id="charts-section">', '<div class="tab-content" id="tab-chart">')
chart_content = chart_content.replace('</section>', '</div>')

# now get current index.html
with open('templates/index.html', 'r') as f:
    current_html = f.read()

# fix the tab-analysis and tab-data
current_html = re.sub(r'<!-- New Analysis Tab -->.*?</div>', '<!-- Chart Tab -->\n' + chart_content, current_html, flags=re.DOTALL)

current_html = current_html.replace('id="tab-data"', 'id="tab-settings"')
current_html = current_html.replace('<!-- New Data Management Tab -->', '<!-- Settings Tab -->')

with open('templates/index.html', 'w') as f:
    f.write(current_html)

print("Fixed tabs")
