import re

with open("templates/index.html", "r") as f:
    html = f.read()

# Remove the old sticky header and animated orbs
header_pattern = re.compile(r'<!-- Sticky Header -->.*?<!-- Historical View Exit Banner -->', re.DOTALL)

new_top = """<!-- Dashboard Layout Container -->
  <div class="dashboard-layout">
    
    <!-- Left Sidebar -->
    <aside class="dashboard-sidebar" id="sidebar-section">
      <div class="sidebar-header">
        <div class="brand">
          <div class="logo-badge">CBR</div>
          <div class="brand-title">
            <h1>Challenger Card</h1>
            <p>Digital Dashboard</p>
          </div>
        </div>
        <button id="sidebar-close-btn" class="sidebar-close-btn">&times;</button>
      </div>

      <!-- Navigation Tabs (Vertical) -->
      <div class="tabs-header vertical-tabs">
        <button class="tab-btn active" data-tab="tab-syllabus">📚 CBR Syllabus</button>
        <button class="tab-btn" data-tab="tab-barriers">🚧 Barriers (CB)</button>
        <button class="tab-btn" data-tab="tab-questions">❓ Study Qs</button>
        <button class="tab-btn" data-tab="tab-persons">👤 PERSONS</button>
        <button class="tab-btn" data-tab="tab-history">📁 Card History</button>
      </div>
      
      <!-- Insert Tabs Content Here -->
      <div class="sidebar-tab-contents">
"""
html = header_pattern.sub(new_top + '    <!-- Historical View Exit Banner -->', html)

# Now extract the tab contents from the bottom
tabs_pattern = re.compile(r'<!-- Syllabus tab contents -->.*?<!-- Library section moved into History tab in sidebar -->', re.DOTALL)
tabs_match = tabs_pattern.search(html)

if tabs_match:
    tabs_content = tabs_match.group(0)
    # Remove from bottom
    html = html.replace(tabs_content, "")
    # Insert into sidebar
    html = html.replace('<!-- Insert Tabs Content Here -->\n      <div class="sidebar-tab-contents">\n', '<!-- Insert Tabs Content Here -->\n      <div class="sidebar-tab-contents">\n' + tabs_content + '      </div>\n    </aside>\n\n    <!-- Main Content Area -->\n    <div class="dashboard-main-wrapper">\n      <!-- Topbar -->\n      <header class="dashboard-topbar">\n        <button class="hamburger" id="hamburger-btn"><span></span><span></span><span></span></button>\n        <div class="topbar-right">\n          <button id="theme-toggle" class="btn-icon">☀️</button>\n          <div class="user-avatar">👤 Profile</div>\n        </div>\n      </header>\n      \n      <main class="dashboard-content">\n')

# We need to clean up the <main class="main-layout"> tag and </main> closing tags
html = html.replace('<!-- Main Panel & Sidebar Grid -->\n    <main class="main-layout">\n      <!-- Left Panel: Grid, Chart, and Scoring -->\n      <div class="left-column">', '')
html = html.replace('      </div>\n\n      <!-- Right Panel: References Sidebar (becomes a mobile drawer) -->\n      <aside class="right-column glass-panel sidebar-panel" id="sidebar-section">', '')
html = html.replace('    <!-- Data Management Panel -->', '  <!-- Data Management Panel -->')
html = html.replace('  </div>\n\n  <!-- ================================================== -->', '      </main>\n    </div>\n  </div>\n\n  <!-- ================================================== -->')

with open("templates/index.html", "w") as f:
    f.write(html)
