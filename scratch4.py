from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
    
    def handle_starttag(self, tag, attrs):
        if tag not in ['meta', 'link', 'br', 'img', 'input', 'hr', 'source', 'path', 'span', 'svg']:
            self.stack.append(tag)
    
    def handle_endtag(self, tag):
        if tag not in ['meta', 'link', 'br', 'img', 'input', 'hr', 'source', 'path', 'span', 'svg']:
            if self.stack:
                if self.stack[-1] == tag:
                    self.stack.pop()
                else:
                    self.errors.append(f"Mismatched end tag: {tag}, expected {self.stack[-1]}")
            else:
                self.errors.append(f"Extra end tag: {tag}")

parser = MyHTMLParser()
with open("templates/index.html", "r") as f:
    parser.feed(f.read())

print("Stack left:", parser.stack)
print("Errors:", parser.errors)
