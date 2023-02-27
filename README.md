# Taptapir


## Make 2D Mobile Games
An ursina-inspired 2d framework for the web/mobile.

![Banner](/docs/taptapir_portfolio_banner.webp)




## Sunsnake

Sunsnake is a Python inspired language for the web.

* Runs in the browser.
* Transpiles into JavaScript.
* Indentation significant, no more {}-brackets :)
* Significantly faster than Python.
* Supports macros.

If you don't want to use Sunsnake, you can still use Taptapir with JavaScript.

![Screenshot](https://pokepetter.github.io/taptapir/docs/sunsnake_code_screenshot.png)




## Getting Started
1. Make a folder for your project

2. Clone Taptapir
```
git clone https://github.com/pokepetter/taptapir.git --depth=1
```

3. Make a .html file like this:

```html
<html><title>title</title><body>
<script src="/taptapir/taptapir.js"></script>
<script type="text/sunsnake">
# code here
</script><script src="/taptapir/sunsnake_compiler.js"></script></html>
```

4. Open the file in a browser.




## Example

### Counter
```py

<html><title>title</title><body>
<script src="../../taptapir.js"></script>
<script type="text/sunsnake">

set_background_color('#fff')
set_window_color('#fff')
score = 0
text = Text(text='00', text_origin=[0,0], scale=1, y=.2, text_size=8)
b = Button(text='Click me!', color=hsv(160,1,.6), scale=[.3,.15], text_color=color.white)
b.on_click = def():
    score += 1
    text.text = `${score}`
    b.scale = [e*1.25 for e in [.3,.15]]
    b.animate('scale_x', .3, duration=.1)
    b.animate('scale_y', .15, duration=.1)


</script><script src="../../sunsnake_compiler.js"></script></html>
```

Try here: https://pokepetter.github.io/taptapir/docs/samples/counter.html
