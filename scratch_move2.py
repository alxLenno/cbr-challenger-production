import re

with open('templates/index.html', 'r') as f:
    html = f.read()

# 1. Extract Scoring Table Matrix
scoring_pattern = re.compile(r'(<!-- Scoring Table Matrix -->.*?</section>\n)', re.DOTALL)
scoring_match = scoring_pattern.search(html)
if not scoring_match:
    print("Scoring section not found!")
    exit(1)
scoring_html = scoring_match.group(1)
html = html.replace(scoring_html, '')

# 2. Add Tab Button
tabs_header_end = '<button class="tab-btn" data-tab="tab-chart">📈 Early-Riser Chart</button>'
new_tabs = tabs_header_end + '\n          <button class="tab-btn" data-tab="tab-scoring">📊 Point Analysis</button>'
html = html.replace(tabs_header_end, new_tabs)

# 3. Add Tab Contents at the end of the sidebar
settings_tab_end = '<!-- Settings tab contents -->\n        <div class="tab-content" id="tab-settings">'
# Actually, it's easier to just insert it right before the final `</aside>` tag
new_tab_contents = f"""        <!-- Scoring tab contents -->
        <div class="tab-content" id="tab-scoring">
{scoring_html}        </div>

"""
html = html.replace('      </aside>', new_tab_contents + '      </aside>')

with open('templates/index.html', 'w') as f:
    f.write(html)

print("Modifications done.")
