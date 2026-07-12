import sys

def check_braces(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
        
    stack = []
    in_string = False
    in_comment = False
    string_char = None
    
    for line_num, line in enumerate(lines, 1):
        i = 0
        while i < len(line):
            c = line[i]
            
            # Simple string handling (ignores escaping for now to keep it simple, 
            # but let's do a basic one)
            if not in_string and not in_comment:
                if c == '/' and i + 1 < len(line) and line[i+1] == '/':
                    break # Line comment
                if c == '/' and i + 1 < len(line) and line[i+1] == '*':
                    in_comment = True
                    i += 1
                elif c in ["'", '"', "`"]:
                    in_string = True
                    string_char = c
                elif c == '{':
                    stack.append(line_num)
                elif c == '}':
                    if stack:
                        stack.pop()
                    else:
                        print(f"Extra closing brace at line {line_num}")
            elif in_string:
                if c == '\\':
                    i += 1 # skip escaped char
                elif c == string_char:
                    in_string = False
            elif in_comment:
                if c == '*' and i + 1 < len(line) and line[i+1] == '/':
                    in_comment = False
                    i += 1
            i += 1
            
    if stack:
        print(f"Unclosed braces opened at lines: {stack}")
    else:
        print("Braces are balanced (according to this simple parser).")

check_braces("static/js/tabs/dashboard.js")
