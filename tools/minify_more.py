

with open('taptapir-min.js', 'r') as f:
    text = f.read()

text = text.replace('document.addEventListener', '_a')
text = text.replace('document.createElement', '_c')
text = text.replace('document.', '_d.')
text = text.replace('browser_aspect_ratio', '_b')

text = '''
    _d=document;
    _c=(arg)=>{return document.createElement(arg)};
    _a=_d.addEventListener;
    ''' + text


active = False
shortenable_vars = []
delimiters = '!"#$%&\'()*+,-./:;<=>?@[\\]^`{|}~'
current_var_name = ''

for char in text:
    if char == '_' and not active:
        active = True
        current_var_name = char
        continue

    if char in delimiters:
        active = False
        if current_var_name and not current_var_name in shortenable_vars and len(current_var_name) > 2:
            shortenable_vars.append(current_var_name)

    if active:
        current_var_name += char


# new_var_names = 'abcdefghijklmnopqrstuvwxyzαβγδεζηθικλμνξοπρσςτυφχψω'
# new_var_names = 'abcdefghijklmnopqrstuvwxyz'
new_var_names = 'αβγδεζηθικλμνξοπρσςτυφχψω'
from itertools import combinations
import re
new_var_names = [e for e in new_var_names]
new_var_names.extend([''.join(e) for e in list(combinations(new_var_names, 2))])
print(shortenable_vars)
# print(new_var_names)
print(len(shortenable_vars), len(new_var_names))
for i, var_name in enumerate(shortenable_vars):
    if i >= len(new_var_names):
        break

    # print(f'replace {var_name} with {new_var_names[i]}')
    # text = text.replace(var_name, new_var_names[i])
    # replace "Python" with "Java" only if it has punctuation on both sides
    # regex_string = f'(?<=[^\w\s]){var_name}(?=[^\w\s])'
    regex_string = f'(?<=[^\w\s]){var_name}(?=[^\w\s])|(?<=\s){var_name}(?=[^\w\s])|(?<=[^\w\s]){var_name}(?=\s)|(?<=\s){var_name}(?=\s)'

    text = re.sub(regex_string, new_var_names[i], text)

# print(text)
with open('taptapir-min-min.js', 'w') as f:
    f.write(text)
