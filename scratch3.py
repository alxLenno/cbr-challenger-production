with open("templates/index.html", "r") as f:
    html = f.read()

html = html.replace(
    "const overlay = document.getElementById('mobile-sidebar-overlay');",
    "const overlay = document.getElementById('mobile-sidebar-overlay');\n    const sidebarClose = document.getElementById('sidebar-close-btn');"
)

html = html.replace(
    "overlay.addEventListener('click', () => {",
    "const closeSidebar = () => {\n      hamburger.classList.remove('open');\n      sidebar.classList.remove('open');\n      overlay.classList.remove('open');\n    };\n    overlay.addEventListener('click', closeSidebar);\n    if(sidebarClose) sidebarClose.addEventListener('click', closeSidebar);\n    /*"
)

html = html.replace(
    "hamburger.classList.remove('open');\n      sidebar.classList.remove('open');\n      overlay.classList.remove('open');\n    });",
    "*/"
)

with open("templates/index.html", "w") as f:
    f.write(html)
