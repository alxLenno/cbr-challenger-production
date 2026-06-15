import re

with open("static/css/style.css", "r") as f:
    css = f.read()

# 1. Update theme colors to be sleek and professional (no neon gradients)
css = css.replace('--primary: #f59e0b;', '--primary: #2563eb;')
css = css.replace('--primary-hover: #d97706;', '--primary-hover: #1d4ed8;')
css = css.replace('--primary-rgb: 245, 158, 11;', '--primary-rgb: 37, 99, 235;')
css = css.replace('--panel-bg: rgba(255, 255, 255, 0.03);', '--panel-bg: #1e293b;')
css = css.replace('--panel-border: rgba(255, 255, 255, 0.08);', '--panel-border: #334155;')

css = css.replace('--panel-bg: rgba(255, 255, 255, 0.6);', '--panel-bg: #ffffff;')
css = css.replace('--panel-border: rgba(255, 255, 255, 0.8);', '--panel-border: #e2e8f0;')

css = re.sub(r'body \{.*?\}', 'body {\n  background-color: #0f172a;\n  color: var(--text-primary);\n  line-height: 1.6;\n  overflow-x: hidden;\n}', css, count=1, flags=re.DOTALL)
css = re.sub(r'\.light-mode body \{.*?\}', '.light-mode body {\n  background-color: #f8fafc;\n}', css, count=1, flags=re.DOTALL)

# 2. Update Glass Panel to Solid Widget Card
css = re.sub(r'\.glass-panel \{.*?\}', '.glass-panel {\n  background: var(--panel-bg);\n  border: 1px solid var(--panel-border);\n  border-radius: var(--radius-lg);\n  padding: 1.5rem;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);\n}', css, count=1, flags=re.DOTALL)

# 3. Add Dashboard Layout CSS
dashboard_css = """
/* ===================================================
   PROFESSIONAL DASHBOARD LAYOUT
=================================================== */
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Sidebar */
.dashboard-sidebar {
  width: 260px;
  background: var(--panel-bg);
  border-right: 1px solid var(--panel-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 100;
  transition: transform var(--transition-normal);
}

.sidebar-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--panel-border);
}

.sidebar-close-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
}

.sidebar-tab-contents {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Vertical Tabs */
.vertical-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem;
}

.vertical-tabs .tab-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-align: left;
  justify-content: flex-start;
  transition: all var(--transition-fast);
}

.vertical-tabs .tab-btn:hover {
  background: rgba(var(--primary-rgb), 0.05);
  color: var(--primary);
}

.vertical-tabs .tab-btn.active {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
  font-weight: 600;
}

/* Main Area */
.dashboard-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0f172a;
}
.light-mode .dashboard-main-wrapper {
  background: #f8fafc;
}

.dashboard-topbar {
  height: 60px;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  flex-shrink: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
}

.user-avatar {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.4rem 1rem;
  background: rgba(0,0,0,0.1);
  border-radius: 20px;
}
.light-mode .user-avatar { background: rgba(0,0,0,0.05); }

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Remove old structural stuff */
#main-header, .page-wrapper { display: none !important; }

/* Mobile Overlay */
.mobile-sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-normal);
}
.mobile-sidebar-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

/* Media Queries for Sidebar */
@media (max-width: 900px) {
  .dashboard-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
  }
  .dashboard-sidebar.open {
    transform: translateX(0);
  }
  .sidebar-close-btn {
    display: block;
  }
  .mobile-sidebar-overlay {
    display: block;
  }
  .dashboard-topbar {
    padding: 0 1rem;
    justify-content: flex-start;
  }
  .hamburger { display: flex; margin-right: 1rem; }
  .dashboard-content { padding: 1rem; }
}
"""

css += dashboard_css

# Also remove old layout classes to avoid confusion
css = re.sub(r'\.main-layout \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\.left-column \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\.right-column \{.*?\}', '', css, flags=re.DOTALL)

with open("static/css/style.css", "w") as f:
    f.write(css)

