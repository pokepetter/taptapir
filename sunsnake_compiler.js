print = console.log
_class_names = ['Entity', 'Button', 'Text', 'HealthBar', 'RainbowSlider', 'InputField']
_language = 'sunsnake'

Array.prototype.at = function(i) {
    if (i < 0) {
        i = this.length + i
    }
    return this[i]
}

function compile(script) {
    try {t = performance.now()} catch {}
    // start parsing
    script = script.replaceAll(',\n', ',')
    script = script.replaceAll('(\n', '(')
    script = script.replaceAll('{\n', '{')
    script = script.replaceAll('[\n', '[')
    script = script.replaceAll(' == ', ' === ')
    script = script.replaceAll('.index(', '.indexOf(')

    var all_lines = script.split('\n');
    var lines = []
    lines.push('\n')

    strings = []
    string_index = 0
    const regexp = '\'(.*?)\'';
    const regexp_backtick = '\`(.*?)\`';

    extra_replacements = []
    is_in_merge_lines_mode = false;

    for (var i=0; i<all_lines.length; i++) {
        if (!all_lines[i].trim()) {
            // print('skip line')
            continue
        }
        line = all_lines[i].trimStart()
        if (line.startsWith('//')) {
            continue
        }
        if (line.startsWith('#')) {
            continue
        }
        if (all_lines[i].includes(': #')) {
            all_lines[i] = all_lines[i].split(': #')[0] + ':'
        }
        if (line == `'language=python'`) {
            _language = 'python'
        }
        else if (line == `'language=sunsnake'`) {
            _language = 'sunsnake'
        }
        if (_language == 'python') {
            continue
        }
        // remove text so it doesn't get parsed as code.
        quotes = [...all_lines[i].matchAll(regexp)];
        quotes.push(...all_lines[i].matchAll(regexp_backtick))

        for (var j=0; j<quotes.length; j++) {
            if (quotes[j][1].length > 0) {
                strings.push(quotes[j][1])
                // print('TEXT_CONTENT_$', string_index, quotes[j][1])
                all_lines[i] = all_lines[i].replace(`'${quotes[j][1]}'`, `[TEXT_CONTENT_${string_index}]`)
                string_index += 1
            }
        }

        // after keyword for easier invoke()
        if (line.startsWith('after ') && all_lines[i].trimEnd().endsWith(':')) {
            start_indent = get_indent(all_lines[i])
            all_lines[i] = all_lines[i].replaceAll('after ', 'after(')
            all_lines[i] = all_lines[i].slice(0,-1) + ', function()'
            for (var j=i+1; j<all_lines.length; j++) {
                if (get_indent(all_lines[j]) <= start_indent) {
                    break
                }
            }
        }

        if (all_lines[i].startsWith('class ')) {
          class_name = all_lines[i].slice(6).split(' ')[0]
          print('found class:', class_name)
            _class_names.push(class_name)
        }

        lines.push(all_lines[i])
    }

    for (var i=0; i<lines.length; i++) {
        if (lines[i].trimStart().startsWith('sunsnake.define(')) {
            content = lines[i].slice(16, -1)
            const [key, ...rest] = content.split(',')
            const value = rest.join(',')
            content = [key, value]
            extra_replacements.push(content)
            lines[i] = ''
            continue
        }
        for (e of extra_replacements) {
            lines[i] = lines[i].replaceAll(e[0], e[1])
        }
        lines[i] = lines[i].replaceAll(' and ', ' && ')
        lines[i] = lines[i].replaceAll(' or ', ' || ')
        lines[i] = lines[i].replaceAll(' not ', ' ! ')
        lines[i] = lines[i].replaceAll('(not ', '(! ')
        lines[i] = lines[i].replaceAll('def ', 'function ')
        lines[i] = lines[i].replaceAll('def():', 'function()')
        lines[i] = lines[i].replaceAll('.append(', '.push(')
        lines[i] = lines[i].replaceAll('.add(', '.push(')
        lines[i] = lines[i].replaceAll('.sum()', '.reduce((a, b) => a + b, 0)')
        lines[i] = lines[i].replaceAll('[-1]', '.at(-1)')
        lines[i] = lines[i].replaceAll(' # ', ' //')   // comments

        // list comprehention
        if (lines[i].includes('[') && lines[i].includes(']') && lines[i].includes(' for ') && lines[i].includes(' in ') && !lines[i].endsWith(':') && !lines[i].includes('[[')) {
            // remove part before list comprehension
            if (lines[i].includes(' = [')) {
                code_before_list_comprehension = lines[i].split(' = [')[0] + ' = '
                list_comprehension = lines[i].split(' = [')[1]
            }
            else {
                code_before_list_comprehension = lines[i].split('[')[0]
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
                filter_code = `.myCustomFilter(${element_name} => {if (${condition}) return ${element_name}})`
            }

            lines[i] = `${code_before_list_comprehension}${target_list}${map_code}${filter_code}${code_after_list_comprehension}`
        }

        if (lines[i].endsWith(':')) {
            lines[i] = lines[i].slice(0,-1)
        }

        // ifs
        if (lines[i].trimStart().startsWith('if ')) {
            lines[i] = lines[i].replace('if ', 'if (')
            lines[i] = lines[i] + ')'
        }
        // elifs
        else if (lines[i].trimStart().startsWith('elif ')) {
            lines[i] = lines[i].replace('elif ', 'else if (')
            lines[i] = lines[i] + ')'
        }

        // dict iteration
        else if (lines[i].trimStart().startsWith('for key, value in ') && lines[i].includes('.items()')) {
            var dict_name = lines[i].split('for key, value in ')[1].split('.items()')[0]
            lines[i] = lines[i].replace('for key, value in ', 'for (let [key, value] of ')
            lines[i] = lines[i].replace(`${dict_name}.items()`, `Object.entries(${dict_name}))`)
        }

        // for loops
        else if (lines[i].trimStart().startsWith('for ') && lines[i].includes(' in ')) {
            start = lines[i].split('for ')[0]   // keep indentation
            elements = lines[i].split('for ')[1].split(' in ')[0]
            array = lines[i].split(' in ')[1]

            // normal for loop
            if (!elements.includes(', ')) {
                lines[i] = lines[i].replace('for ', 'for (var ')
                lines[i] = lines[i].replace(' in ', ' of ')
                lines[i] = lines[i] + ')'
            }
            // auto enumerate, match 'for ?, ? in ?'
            else {
                elements = `[${elements}]`
                if (!array.startsWith('enumerate(')) {
                    array = `enumerate(${array})`
                }
                lines[i] = `${start}for (let ${elements} of ${array})`
            }

        }

        // is in list
        if (lines[i].includes(' in ') && !lines[i].includes('for ')) {
            word_before_in = lines[i].split(' in ')[0].split(' ').pop()
            if (word_before_in.startsWith('(')) {
                word_before_in = word_before_in.slice(1) // remove first and last
            }
            // print('word before:', word_before_in)
            word_after_in =  lines[i].split(' in ')[1].split(' ')[0]
            if (word_after_in.endsWith(')') && !word_after_in.endsWith('()')) {
                word_after_in = word_after_in.slice(0,-1)
            }
            // print('word after:', word_after_in)
            lines[i] = lines[i].replace(`${word_before_in} in ${word_after_in}`, `${word_after_in}.includes(${word_before_in})`)
        }

        for (var class_name of ['dict', ]) {
            if (lines[i].includes(`${class_name}({`)) {
                continue
            }
            if (lines[i].startsWith(`${class_name}(`) || lines[i].includes(` ${class_name}(`)) {
                lines[i] = convert_arguments(lines[i], class_name)
            }
        }

        for (var class_name of _class_names) {
            is_first_word = lines[i].startsWith(`${class_name}(`) ? '' : ' '        // don't add space if line starts with 'Entity(', do add otherwise, to ensure we match the whole name
            if (lines[i].includes(`${is_first_word}${class_name}(`)) {
                lines[i] = lines[i].replace(`${is_first_word}${class_name}(`, `${is_first_word}new ${class_name}(`)
                lines[i] = convert_arguments(lines[i], class_name)
            }
        }

        for (var n=0; n<10; n++) {
            lines[i] = lines[i].replaceAll(`${n}ms`, `${n}*.001`)
            lines[i] = lines[i].replaceAll(`${n}s`, `${n}`)
            lines[i] = lines[i].replaceAll(`${n}m`, `${n}*60`)
            lines[i] = lines[i].replaceAll(`${n}h`, `${n}*60*60`)
            lines[i] = lines[i].replaceAll(` in ${n}:`, ` in range(${n}):`)
        }
    }
    // add brackets based on indentation
    current_indent = 0
    after_statement_indents = []

    for (var i=0; i<lines.length; i++) {
        if (i > 0) {
            prev_line_indent = get_indent(lines[i-1])
            current_line_indent = get_indent(lines[i])

            if (current_line_indent > prev_line_indent) {
                lines[i-1] += ' {'
                current_indent = current_line_indent
            }
            if (current_line_indent < prev_line_indent) {
                for (var j of range(current_indent - current_line_indent)) {
                    lines[i-1] += '\n' + '    '.repeat(current_indent-j-1) + '}'

                    if (after_statement_indents.at(-1) === current_indent-j-1) {
                        lines[i-1] += ')'
                        after_statement_indents.pop()
                    }
                }
                current_indent = current_line_indent
            }
            if (lines[i].trimStart().startsWith('after(')) {
                after_statement_indents.push(current_indent)
            }
        }
    }

    new_line = ''
    for (var j of range(current_indent)) {
        new_line += '' + '    '.repeat(current_indent-1) + '}'
    }
    lines.push(new_line)
    var compiled_code = lines.join('\n')

    // add text back in
    for (var i=0; i<strings.length; i++) {
        compiled_code = compiled_code.replace(`[TEXT_CONTENT_${i}]`, `'${strings[i]}'`)
    }

    print('COMPILED CODE:', compiled_code)
    try {print('compiled in', performance.now() - t, 'ms')} catch {}
    return compiled_code
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
function convert_arguments(line, class_name) {
    part_after = line.split(class_name+'(')[1]
    arguments = get_inside_brackets(part_after, '(', ')')
    new_arguments = arguments
    has_inline_function = false

    if (arguments.includes(`function()`)) {
        has_inline_function = true
        func_content = arguments.split('function()')[1]
        lastIndex = arguments.lastIndexOf(')')
        func_content = func_content.substr(0, lastIndex) + func_content.substr(lastIndex)
        function_definition = 'function()' + func_content
        new_arguments = arguments.replace(function_definition, `[INLINE_FUNC_PLACEHOLDER]`)
    }

    keys = new_arguments.split(',').map(e => e.split('=')[0])
    if (!keys.includes('name')) {
        if (line.includes(`= new ${class_name}`)) {
            variable_name = line.split(`= new ${class_name}`)[0].trimStart()
            if (variable_name.startsWith('let ')) {
                variable_name = variable_name.slice(4)
            }
            new_arguments = `name='${variable_name}', ${new_arguments}`
        }
    }
    js_style_arguments = '{' + new_arguments.replaceAll('=', ':') + '}'

    if (has_inline_function) {
        js_style_arguments = js_style_arguments.replace('[INLINE_FUNC_PLACEHOLDER]', 'function(){' + func_content + '}')
    }

    return line.replace(arguments, js_style_arguments)
}

function len(arr) {
    return arr.length
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0)
}

String.prototype.count=function(c) {
    var result = 0, i = 0;
    for(i;i<this.length;i++)if(this[i]==c)result++;
    return result;
}
print = console.log
False = false
True = true
None = null
min = Math.min
max = Math.max
abs = Math.abs
floor = Math.floor
ceil = Math.ceil
math = Math
sqrt = Math.sqrt
function round(value, digits=0) {
    return Number(Math.round(value+'e'+digits)+'e-'+digits);
}

function enumerate(list) {
    if (typeof list === 'array') {
        return list.entries()
    }
    if (typeof list === 'object') {
        return Object.entries(list)
    }
}

function str(value) {
    return value.map(function(i){return String.fromCharCode(i)}).join("")
}

function int(value) {
    if (value === true) {return 1}
    if (value === false) {return 0}
    return parseInt(value)
}

function Array_2d(w, h, default_value=0) {
    var tiles = new Array(w)
    for (var i = 0; i < tiles.length; i++) {
        tiles[i] = new Array(h);
        tiles[i].fill(default_value)
    }
    return tiles
}
function Array_3d(w, h, d) {
    var arr = new Array(w);

    for (var i = 0; i < w; i++) {
        arr[i] = new Array(h);

        for (var j = 0; j < h; j++) {
            arr[i][j] = new Array(d).fill(0);
        }
    }
    return arr;
}
// function range(n) {return Array(n).keys()}
function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }
    if (typeof step == 'undefined') {
        step = 1;
    }
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }
    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }
    return result;
};
Array.prototype.myCustomFilter = function (fn) {
    const filtered = []
    for (let i=0; i<this.length; i++) {
        if (fn(this[i]) != undefined) {
            filtered.push(this[i]);
        }
    }
    return filtered;
}

Array.prototype.remove = function (element) {
    var index = this.indexOf(element)
    if (index >= 0) {
        this.splice(index, 1)
    }
}

function dict(values={}) {
    return values
}
__name__ = null // for python compability
__autocompile__ = true

var scripts = document.getElementsByTagName("script")
for (var script of scripts) {
    if (script.type == 'text/sunsnake') {
        print('compile:', script)
        if (script.textContent) {
            compiled_code = compile(script.textContent)
            eval(compiled_code)
        }
    }
}
