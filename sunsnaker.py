from functools import wraps
from pathlib import Path
from py_mini_racer import py_mini_racer
from textwrap import dedent
import inspect

js_ctx = py_mini_racer.MiniRacer()

# load sunsnake compiler
with (Path(__file__).parent / 'sunsnake_compiler.js').open('r', encoding='utf-8') as f:
    text = f.read()
    compiler = js_ctx.eval(text)


def snimport(file):
    with Path(file).open('r', encoding='utf-8') as f:
        sunsnake_code = f.read().strip()
    a = js_ctx.eval(f"compile(`{sunsnake_code}`)")
    a = js_ctx.eval(a)
    # print('-----------------------------------')


def sunsnaker(func=None, include=None):
    '''
    A decorator to compile a Python function into a sunsnake function at runtime.
    '''
    if include is None:
        include = [] 
    else:
        original_include_count = len(include)
        include = tuple(set(include))
        if len(include) < original_include_count:
            print_warning('Included more than one copy in:', func)

    if func is None:
        return lambda func: sunsnaker(func, include=include)

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:    # try to run it to see if it's already been compiled
            return js_ctx.call(func.__name__, *args, **kwargs)
            
        except:
            sunsnake_code = inspect.getsource(func).replace('@sunsnaker', '')
            sunsnake_code = dedent(sunsnake_code)
            js_code = js_ctx.eval(f"compile(`{sunsnake_code}`)")
            print('sucessfully compiled sunsnake -> js')
            js_ctx.eval(js_code)
            print('sucessfully evaluated js')
            # print('rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr')
            return js_ctx.call(func.__name__, *args, **kwargs)

    return wrapper


if __name__ == '__main__':
    from time import perf_counter
    t = perf_counter()

    @sunsnaker
    def add(a, b, c):
        return a+b+c

    print('------------', add(1,2,3))
    print('****************', perf_counter() - t)