print = console.log
var poke_script = document.querySelector('script[type="text/pokescript"]').textContent



// start parsing
poke_script = poke_script.replaceAll(',\n', ',')
poke_script = poke_script.replaceAll('(\n', '(')

poke_script = poke_script.replaceAll('.index(', '.indexOf(')

var all_lines = poke_script.split('\n');
var lines = []
lines.push('\n')

strings = []
string_index = 0
const regexp = '\'(.*?)\'';
extra_replacements = []

for (var i=0; i<all_lines.length; i++) {

    if (!all_lines[i].trim()) {
        continue
    }
    if (all_lines[i].trimStart().startsWith('//')) {
        continue
    }
    if (all_lines[i].trimStart().startsWith('#')) {
        continue
    }
    // if (all_lines[i].trimStart().startsWith('define(')) {}
    // remove text so it doesn't get parsed as code.
    quotes = [...all_lines[i].matchAll(regexp)];

    for (var j=0; j<quotes.length; j++) {
        if (quotes[j][1].length > 0) {
            strings.push(quotes[j][1])
            // print('TEXT_CONTENT_$', string_index, quotes[j][1])
            all_lines[i] = all_lines[i].replace(`'${quotes[j][1]}'`, `[TEXT_CONTENT_${string_index}]`)
            string_index += 1
        }
    }

    lines.push(all_lines[i])
}

function get_indent(str) {
    if (!str || !str.trim()) {
        return 0
    }
    return (str.length - str.trimStart().length) / 4

}

function get_inside_brackets(str, open_bracket, closing_bracket) {
    text_inside_bracket = ''
    counter = 1

    for (const char of str) {
        if (char == open_bracket)
            counter += 1

        if (char == closing_bracket)
            counter -= 1

            if (counter == 0)
                return text_inside_bracket

        text_inside_bracket += char
    }

}
// print('LINES:', lines.join('\n'))

// add brackets based on indentation
current_indent = 0

for (var i=0; i<lines.length; i++) {
    if (i > 0) {
        prev_line_indent = get_indent(lines[i-1])
        current_line_indent = get_indent(lines[i])

        if (current_line_indent > prev_line_indent) {
            lines[i-1] += ' {'
            current_indent = current_line_indent
        }

        if (current_line_indent < prev_line_indent) {

            lines[i-1] += '}'.repeat(current_indent - current_line_indent)
            current_indent = current_line_indent
        }
    }
}
lines.push('}'.repeat(current_indent))
// print(lines.join('\n'))

for (var i=0; i<lines.length; i++) {
    if (lines[i].trimStart().startsWith('compiler.define(')) {
        content = lines[i].slice(16, -1)
        const [key, ...rest] = content.split(',')
        const value = rest.join(',')
        content = [key, value]
        extra_replacements.push(content)
        lines[i] = ''
        i += 1
    }
    for (e of extra_replacements) {
        lines[i] = lines[i].replaceAll(e[0], e[1])
        // print('prepal??ce')

    }
    lines[i] = lines[i].replaceAll(' and ', ' && ')
    lines[i] = lines[i].replaceAll(' or ', ' || ')
    lines[i] = lines[i].replaceAll(' not ', ' ! ')
    lines[i] = lines[i].replaceAll('(not ', '(! ')
    lines[i] = lines[i].replace('def ', 'function ')
    lines[i] = lines[i].replace('def(): ', 'function() ')
    lines[i] = lines[i].replaceAll('.append(', '.push(')
    lines[i] = lines[i].replaceAll('.add(', '.push(')
    lines[i] = lines[i].replaceAll('.sum()', '.reduce((a, b) => a + b, 0)')


    if (lines[i].includes('[') && lines[i].includes(']') && lines[i].includes(' for ') && lines[i].includes(' in ') &&  !lines[i].includes(' enumerate(')) {
        // remove part before list comprehension
        if (lines[i].includes(' = [')) {
            code_before_list_comprehension = lines[i].split(' = [')[0] + ' = '
            list_comprehension = lines[i].split(' = [')[1]
        }
        else {
            code_before_list_comprehension = ''
            list_comprehension = lines[i].split('[')[1]
        }

        code_after_list_comprehension = list_comprehension.substring(list_comprehension.lastIndexOf(']')+1)
        list_comprehension = list_comprehension.substring(0, list_comprehension.lastIndexOf(']'))
        // print('code_after_list_comprehension:', code_after_list_comprehension)
        // print('list_comprehension:', list_comprehension)

        first_var =  list_comprehension.split(' for ')[0]
        element_name = list_comprehension.split(' for ')[1].split(' in ')[0]

        target_list = list_comprehension.split(' in ')[1]
        if (target_list.includes(' if ')) {
            target_list = target_list.split(' if ')[0]
        }

        condition = ''
        if (list_comprehension.includes(' if ')) {
            condition = list_comprehension.split(target_list)[1].split(' if ')[1]    // get the part after the target list and remove the if and the last ]
        }

        map_code = ''
        if (first_var != element_name) {
            map_code = `.map(${element_name} => ${first_var})`
        }

        filter_code = ''
        if (condition != '') {
            filter_code = `.filter(${element_name} => {if (${condition}) return ${element_name}})`
        }

        lines[i] = `${code_before_list_comprehension}${target_list}${map_code}${filter_code}${code_after_list_comprehension}`
    }

    lines[i] = lines[i].replace(': {', ' {')
    lines[i] = lines[i].replaceAll('for i, e in enumerate(', 'for [i, e] in enumerate(')
    lines[i] = lines[i].replaceAll('for y, line in enumerate(', 'for [y, line] in enumerate(')
    lines[i] = lines[i].replaceAll('for x, char in enumerate(', 'for [x, char] in enumerate(')

    // ifs
    if (lines[i].trim().startsWith('if ') && lines[i].trim().endsWith(' {')) {
        lines[i] = lines[i].replace('if ', 'if (')
        lines[i] = lines[i].replace(' {', ') {')
    }
    // elifs
    if (lines[i].trim().startsWith('elif ') && lines[i].trim().endsWith(' {')) {
        lines[i] = lines[i].replace('elif ', 'else if (')
        lines[i] = lines[i].replace(' {', ') {')
    }

    // dict iteration
    if (lines[i].trimStart().startsWith('for key, value in ') && lines[i].includes('.items()')) {
        var dict_name = lines[i].split('for key, value in ')[1].split('.items()')[0]
        lines[i] = lines[i].replace('for key, value in ', 'for (const [key, value] of ')
        lines[i] = lines[i].replace(`${dict_name}.items()`, `Object.entries(${dict_name}))`)
        }

    // for loops
    else if (lines[i].trimStart().startsWith('for ') && lines[i].includes(' in ')) {
        lines[i] = lines[i].replace('for ', 'for (const ')
        lines[i] = lines[i].replace(' in ', ' of ')
        lines[i] = lines[i].replace(' {', ') {')

    }
    // is in list
    else if (lines[i].includes(' in ')) {
        word_before_in = lines[i].split(' in ')[0].split(' ').pop()
        // print('word before:', word_before_in)
        word_after_in =  lines[i].split(' in ')[1].split(' ')[0]
        if (word_after_in.endsWith(')') && !word_after_in.endsWith('()')) {
            word_after_in = word_after_in.slice(0, -1)
        }
        // print('word after:', word_after_in)
        lines[i] = lines[i].replace(`${word_before_in} in ${word_after_in}`, `${word_after_in}.includes(${word_before_in})`)
    }

    for (var class_name of ['Button', 'Text']) {
        if (lines[i].includes(`${class_name}({`)) {
            continue
        }
        if (lines[i].includes(`${class_name}(`)) {
            lines[i] = convert_arguments(lines[i], class_name)

            // if (func) {
            //     lines[i] = lines[i].replace('INLINE_FUNC_PLACEHOLDER', func)
            // }
        }
    }
    if (lines[i].includes('new Entity({')) {
        continue
    }
    if (lines[i].includes('Entity(')) {
        lines[i] = convert_arguments(lines[i], 'Entity')
        lines[i] = lines[i].replace('Entity(', 'new Entity(')
    }
}

function convert_arguments(line, class_name) {
    part_after = line.split(class_name+'(')[1]
    arguments = get_inside_brackets(part_after, '(', ')')
    new_arguments = arguments
    has_inline_function = false

    if (arguments.includes(`def():`)) {
        has_inline_function = true
        func_content = arguments.split('def():')[1]
        lastIndex = arguments.lastIndexOf(')')
        func_content = func_content.substr(0, lastIndex) + func_content.substr(lastIndex)
        function_definition = 'def():' + func_content
        new_arguments = arguments.replace(function_definition, `[INLINE_FUNC_PLACEHOLDER]`)
    }

    js_style_arguments = '{' + new_arguments.replaceAll('=', ':') + '}'

    if (has_inline_function) {
        js_style_arguments = js_style_arguments.replace('[INLINE_FUNC_PLACEHOLDER]', 'function(){' + func_content + '}')
    }

    return line.replace(arguments, js_style_arguments)
}

var compiled_code = lines.join('\n')

// add text back in
for (var i=0; i<strings.length; i++) {
    compiled_code = compiled_code.replace(`[TEXT_CONTENT_${i}]`, `'${strings[i]}'`)
}

print('COMPILED CODE:', compiled_code)
eval(compiled_code)
