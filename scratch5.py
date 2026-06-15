with open("templates/index.html", "r") as f:
    html = f.read()

# Remove the incorrectly placed </aside> and </main>
html = html.replace('      </aside>\n    </main>\n\n    <!-- Library section moved into History tab in sidebar -->', '')
html = html.replace('      </aside>\n    </main>\n\n', '')
html = html.replace('</aside>\n    </main>', '')

with open("templates/index.html", "w") as f:
    f.write(html)
