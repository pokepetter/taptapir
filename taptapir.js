// aspect_ratio = 16/9
scale = 1
print = console.log

Array.prototype.remove = function (element) {
    var index = this.indexOf(element)
    if (index >= 0) {
        this.splice(index, 1)
    }
}

var _loading_text = document.getElementById('loading_text')
if (_loading_text) {
    _loading_text.remove()
}
const style = document.createElement('style')
style.textContent = `
.entity {
  touch-action: none;
  width:100%; height:100%; position:absolute; top:50%; left:50%; will-change: transform;
  transform:translate(-50%, -50%); color:black; background-size: 100% 100%; padding:0; border-width:0px;
  visibility: 'visible'; display:inherit; image-rendering: pixelated;
  background-repeat:repeat;
  white-space: pre;
}
.entity:focus {
  outline: 0; -moz-outline-style: none;
}

#game {margin:auto; background-color: darkgreen; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); overflow: hidden; pointer-events: none;
  width:100%; height:100%; outline: 0; box-shadow: 0; touch-action: none; user-select: none;
  white-space: pre-wrap;
}
fullscreen_button {padding: 4px 4px; width: 64px; height: 64px; background-color: #555; border-radius: .2em; border-width: 0px;
  text-decoration: none; color: white; font-size: 50.0px; z-index: 1; position: absolute; text-align: center; right: 0%;
}
body {
  margin:0;
  background-color:'#111';
  font-family: CerebriSans-Regular,-apple-system,system-ui,Roboto,sans-serif;
  overscroll-behavior-y: contain;
}
#loading_text {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  color: white;
  font-family:monospace;
  transform: translate(-50%, -5%);
  text-align: center;
}
input, textarea {
  pointer-events: auto;
  height: 100%;
  width: 100%;
  font-size: inherit;
  font-family: monospace;
  border-radius: inherit;
  background-color: inherit;
  border-width: inherit;
  text-indent: .5em;
  resize: none;
  color: inherit;
}
`
document.head.append(style)

var _game_window = document.getElementById('game')
if (!_game_window) {
    var _game_window = document.createElement('game')
    _game_window.id = 'game'
    if (!document.body) {
        document.body = document.createElement('body')
    }
    document.body.appendChild(_game_window)
}
const scene = document.createElement('entity')
scene.className = 'entity'
scene.id = 'scene'
scene._children = []
_game_window.appendChild(scene)

// print('browser aspect_ratio:', browser_aspect_ratio)
format = null
is_mobile = 'ontouchstart' in document.documentElement
fullscreen = false
camera = null

function set_orientation(value) {
    var width = window.innerWidth
    var height = window.innerHeight
    browser_aspect_ratio = width / height
    // print('width:', width, 'height:', height, 'browser_aspect_ratio:', browser_aspect_ratio)

    format = value
    if (format == 'vertical') {
        aspect_ratio = 16/9
        // used for setting correct draggable limits
        asp_x = 1
        asp_y = 9/16

        if (browser_aspect_ratio >= 9/16) { // if the screen is wider than the game, like a pc monitor.
            // print('vertical view desktop')
            _game_window.style.width = `${width*scale/browser_aspect_ratio/(16/9)}px`
            _game_window.style.height =  `${height*scale}px`
        }
        else {                              // if the screen is taller than the game, like a phone screen.
            // print('vertical view mobile')
            _game_window.style.height = `${width*scale*(16/9)}px`
            _game_window.style.width =  `${width*scale}px`
        }
        if (camera) {camera.ui.scale = [1, 1/aspect_ratio]}
        top_left =      [-.5, .5*aspect_ratio]
        top_right =     [.5, .5*aspect_ratio]
        bottom_left =   [-.5, -.5*aspect_ratio]
        bottom_right =  [.5, -.5*aspect_ratio]
        top =           [0, .5*aspect_ratio]
        bottom =        [0, -.5*aspect_ratio]
        left =          [-.5, 0]
        right =         [.5, 0]
    }
    else {
        aspect_ratio = 16/9
        asp_x = 16/9
        asp_y = 1
        scene.style.width = `${1/asp_x*100}%`
        scene.style.height = `${1/asp_y*100}%`
        if (browser_aspect_ratio > 16/9) { // if the screen is wider than 16/9, fit to height
            _game_window.style.height = `${height*scale}px`
            _game_window.style.width =  `${width*scale/browser_aspect_ratio*16/9}px`
        }
        else {                              // if the screen is taller than 16/9, fit to width
            _game_window.style.height = `${height*scale*browser_aspect_ratio/(16/9)}px`
            _game_window.style.width =  `${width*scale}px`
        }
        if (camera) {camera.ui.scale = [1/aspect_ratio, 1]}
        top_left =      [-.5*aspect_ratio, .5]
        top_right =     [.5*aspect_ratio, .5]
        bottom_left =   [-.5*aspect_ratio, -.5]
        bottom_right =  [.5*aspect_ratio, -.5]
        top =           [0, .5]
        bottom =        [0, -.5]
        left =          [-.5*aspect_ratio, 0]
        right =         [.5*aspect_ratio, 0]

    }
}
set_orientation('vertical')


function rgb(r, g, b) {return `rgb(${parseInt(r*255)},${parseInt(g*255)},${parseInt(b*255)})`}

function hex_to_rgb(value) {
    if (value.length === 4) {
        value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`   // convert '#333' to '#333333'
    }
    try {
        r = value.slice(1,3)
        g = value.slice(3,5)
        b = value.slice(5,7)
        return [parseInt(r,16), parseInt(g,16), parseInt(b,16)]
    }
    catch (e) {
        console.error('invalid hex code:', value);
    }
}
// from: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
function hsv(h, s, v) {
    h /= 360;
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [parseInt(r*255), parseInt(g*255), parseInt(b*255)];
}

function rgb_to_hsv(_rgb_color) {
    r = _rgb_color[0]
    g = _rgb_color[1]
    b = _rgb_color[2]
    // It converts [0,255] format, to [0,1]
    r = (r === 255) ? 1 : (r % 255 / parseFloat(255))
    g = (g === 255) ? 1 : (g % 255 / parseFloat(255))
    b = (b === 255) ? 1 : (b % 255 / parseFloat(255))
    var max = Math.max(r, g, b)
    var min = Math.min(r, g, b)
    var h, s, v = max
    var d = max - min
    s = max === 0 ? 0 : d / max


    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }
    return [parseInt(h*360), s, v]
}

color = {
  white:         hsv(0, 0, 1),
  smoke:         hsv(0, 0, 0.96),
  light_gray:    hsv(0, 0, 0.75),
  gray:          hsv(0, 0, 0.5),
  dark_gray:     hsv(0, 0, 0.25),
  black:         hsv(0, 0, 0),
  red:           hsv(0, 1, 1),
  orange:        hsv(30, 1, 1),
  yellow:        hsv(60, 1, 1),
  lime:          hsv(90, 1, 1),
  green:         hsv(120, 1, 1),
  turquoise:     hsv(150, 1, 1),
  cyan:          hsv(180, 1, 1),
  azure:         hsv(210, 1, 1),
  blue:          hsv(240, 1, 1),
  violet:        hsv(270, 1, 1),
  magenta:       hsv(300, 1, 1),
  pink:          hsv(330, 1, 1),
  clear:         [0, 0, 0, 0],
}

function set_window_color(value) {_game_window.style.backgroundColor = value}
function set_background_color(value) {document.body.style.backgroundColor = value}
function set_scale(value) {
    scale = value
    set_orientation(format)
}

function set_fullscreen(value) {
    fullscreen = value
    if (value) {
        document.documentElement.requestFullscreen()
    }
    else {
        document.exitFullscreen();
    }
}

ASSETS_FOLDER = ''
entities = []

class Entity {
    constructor(options=null) {
        if (!('type' in options)) {
            options['type'] = 'entity'
        }
        this.add_to_scene = true
        if ('add_to_scene' in options) {
            this.add_to_scene = options['add_to_scene']
        }
        if (!this.add_to_scene) {
            this.el = document.createElement(options['type'])
            entities.push(this)
            for (const [key, value] of Object.entries(options)) {
                this[key] = value
            }
            return
        }

        this.el = document.createElement(options['type'])
        this.el.className = options['type']

        // create another div for the model, for setting origin to work
        this.el.style.backgroundColor = 'rgba(0,0,0,0)'
        // this.el.style.pointerEvents = 'none'
        this.model = document.createElement(options['type'])
        this.model.entity_index = entities.length
        this.model.id = 'model'
        this.el.appendChild(this.model)

        this.model.className = options['type']
        this.model.style.opacity = 1
        entities.push(this)

        this.setTimeout_calls = {}
        if (!('render' in options) || options['render']) {
            scene.appendChild(this.el)
        }

        // if (!'parent' in options) {
            // print('default to scene')
        this.parent = scene
        // }

        this.children = []
        this._enabled = true
        this.on_enable = null
        this.on_disable = null
        this.color = '#ffffff'
        this.x = 0
        this.y = 0
        this.z = 0
        this.scale = [1,1]
        this.draggable = false
        this.dragging = false
        this.lock_x = false
        this.lock_y = false

        this.min_x = -.5 * asp_x
        this.max_x = .5 * asp_x
        this.min_y = -.5 / asp_y
        this.max_y = .5 / asp_y

        this.snap_x = 0
        this.snap_y = 0
        this.text_size = 3
        this._roundness = 0

        for (const [key, value] of Object.entries(options)) {
            this[key] = value
        }
    }
    get name() {return this._name}
    set name(value) {
        this._name = value
        this.el.id = value
    }

    get parent() {return this._parent}
    set parent(value) {
        if (value == null) {
            value = scene
        }
        if (value === scene) {
            value.appendChild(this.el)
        }
        else {
            value.el.appendChild(this.el)
        }
        if (this._parent && this._parent._children) {
            this._parent._children.remove(self)
        }
        this._parent = value
        if (value._children && !value._children.includes(this)) {
            value._children.push(this)
        }
    }
    get children() {return this._children}
    set children(value) {
        this._children = value
        for (const e of value) {
            e.parent = this
        }
    }
    get world_parent() {return this.parent}
    set world_parent(value) {
        wpos = this.world_position
        wscale = this.world_scale
        this.parent = value

        this.world_position = wpos
        this.world_scale = wscale
    }
    get world_x() {return (this.el.getBoundingClientRect().left - scene.getBoundingClientRect().left) / scene.clientWidth}
    get world_y() {return -(this.el.getBoundingClientRect().top - scene.getBoundingClientRect().top) / scene.clientHeight}
    get world_position() {return [this.world_x, this.world_y]}

    get world_scale_x() {return this.el.clientWidth / scene.clientWidth}
    get world_scale_y() {return this.el.clientHeight / scene.clientHeight}
    get world_scale() {return [this.world_scale_x, this.world_scale_y]}

    get descendants() {return this.el.getElementsByTagName('*')}

    get enabled() {return this._enabled}
    set enabled(value) {
        if (value) {
            this.el.style.visibility = 'visible'
            for (var c of this.descendants) {
                c.style.visibility = c.style.original_visibility
            }
        }
        else {
            this.el.style.visibility = 'hidden'
            for (var c of this.descendants) {
                c.style.original_visibility = c.style.visibility
                c.style.visibility = 'inherit'
            }
        }
        this._enabled = value

        if (value && this.on_enable) {
            this.on_enable()
        }
        else if (!value && this.on_disable) {
            this.on_disable()
        }
    }

    get visible_self() {return this._visible_self}
    set visible_self(value) {
        if (!value) {
            this.color = [0,0,0,0]
            this.model.color = 'rgba(0,0,0,0)'
            this.text_color = 'rgba(0,0,0,0)'
        }
        else {
            this.model.color = 'white'
            this.text_color = 'white'
        }
        this._visible_self = value
    }
    get color() {return this._color}
    set color(value) {
        if (typeof value == "string" && value.startsWith('#')) {
            value = hex_to_rgb(value)
        }
        if (value.length == 3) {
            value = [value[0], value[1], value[2], 255]
        }
        // print('set color:', value)
        this._color = value
        this.model.style.backgroundColor = `rgba(${value[0]},${value[1]},${value[2]},${value[3]})`
    }
    get scale_x() {return this._scale_x}
    set scale_x(value) {
        this.el.style.width = `${value*100}%`
        this._scale_x = value
    }
    get scale_y() {return this._scale_y}
    set scale_y(value) {
        this.el.style.height = `${value*100}%`
        this._scale_y = value
    }
    get scale() {return [this._scale_x, this._scale_y]}
    set scale(value) {
        if (typeof value == "number") {value = [value, value]}
        this.scale_x = value[0]
        this.scale_y = value[1]
    }
    get x() {return this._x}
    set x(value) {
        this.el.style.left = `${50+(value*100)}%`

        this._x = value
    }
    get y() {return this._y}
    set y(value) {
        this.el.style.top = `${50+(-value*100)}%`
        this._y = value
    }
    get z() {return this._z}
    set z(value) {
        this._z = value
        this.el.style.zIndex = -value
    }
    get xy() {return [this._x, this._y]}
    set xy(value) {
        this.x = value[0]
        this.y = value[1]
    }
    get xyz() {return [this._x, this._y, this._z]}
    set xyz(value) {
        this.x = value[0]
        this.y = value[1]
        this.z = value[2]
    }
    get position() {return this.xyz}
    set position(value) {
        if (value.length == 2) {return this.xy = value}
        if (value.length == 3) {return this.xyz = value}
    }
    get origin() {return this._origin}
    set origin(value) {
        this.model.style.transform = `translate(${(-value[0]-.5)*100}%, ${(value[1]-.5)*100}%)`
        this._origin = value
    }
    get rotation() {return this._rotation}
    set rotation(value) {
        this._rotation = value
        this.el.style.transform = `translate(-50%, -50%) rotate(${value}deg)`
    }

    get texture() {return this._texture}
    set texture(value) {
        this._texture = value
        if (!value) {
            this.model.style.backgroundImage = 'none'
            return
        }

        if (!value.endsWith('.gif') && !value.startsWith('data:')) {    // static image
            this.model.style.backgroundImage = `url("${ASSETS_FOLDER}${value}")`
            this.visible_self = false
            return
        }

        if (value.endsWith('.gif')) {   // .gif (ensure animation replays on reuse)
            this.model.style.backgroundImage = `url("${ASSETS_FOLDER}${value}?${random_int(0,999)}")`   // add random number so the gif restarts when setting .texture again
            this.visible_self = false
            return
        }

        if (value.startsWith('data:')) {
            this.model.style.backgroundImage = `url("${value}")`
            this.visible_self = false
            return
        }
    }

    get tileset_size() {return this._tileset_size}
    set tileset_size(value) {
        this._tileset_size = value
        this.model.style.backgroundSize = `${value[0]*100}% ${value[1]*100}%`
    }
    get tile_coordinate() {return this._tile}
    set tile_coordinate(value) {        // [0,0] is in lower left
        this._tile = value
        this.model.style.backgroundPosition = `${(this.tileset_size[0]-1)*value[0]*100}% ${(this.tileset_size[1]-1)*(this.tileset_size[1]-1-value[1])*100}%`
    }

    get roundness() {return this._roundness}
    set roundness(value) {
        this.model.style.borderRadius = `${value*Math.min(this.model.clientWidth, this.model.clientHeight)}px`
        this._roundness = clamp(value, 0, .5)
    }
    get shadow() {return this._shadow}
    set shadow(value) {
        this._shadow = value
        if (value === true) {
            this.model.style.boxShadow = "5px 20px 40px black";
        }
        else if (value === false) {
            this.model.style.boxShadow = 'none'
        }
        else {
            this.model.style.boxShadow = value
        }
    }

    get text() {return this.model.textContent}
    set text(value) {
        this.model.innerHTML = value
    }
    get text_color() {return this.model.style.color}
    set text_color(value) {
        if (!(typeof value == "string")) {
            // print('set color:', value)
            var alpha = 255
            if (value.length == 4) {
                alpha = value[3]
            }
            value = `rgba(${value[0]},${value[1]},${value[2]},${alpha})`
        }
        this.model.style.color = value
    }
    get text_size() {return this._text_size}
    set text_size(value) {
        this._text_size = value
        this.model.style.fontSize = `${value*scale}vh`
    }

    get text_origin() {return this._text_origin}
    set text_origin(value) {
        this._text_origin = value
        this.model.style.display = 'flex'
        this.model.style.textAlign = ['left', 'center', 'right'][(value[0]*2)+1]  // horizontally
        this.model.style.justifyContent = ['left', 'center', 'right'][(value[0]*2)+1]  // horizontally
        this.model.style.alignItems = ['flex-end', 'center', 'flex-start'][(value[1]*2)+1]  // vertically
    }

    get alpha() {return this.model.style.opacity}
    set alpha(value) {
        this._alpha = value
        this.model.style.opacity = value
    }
    get padding() {return this._padding}
    set padding(value) {
        this._padding = value
        this.model.style.padding = `${value}em`
    }

    get on_click() {return this._on_click}
    set on_click(value) {
        this._on_click = value
        if (value && !this.ignore_collision) {
            this.model.style.pointerEvents = 'auto'
        }
        else {this.model.style.pointerEvents = 'none'}
    }
    get on_double_click() {return this.ondblclick}
    set on_double_click(value) {
        this.ondblclick = value
        if (value && !this.ignore_collision) {
            this.model.style.pointerEvents = 'auto'
        }
        else {this.model.style.pointerEvents = 'none'}
    }
    get ignore_collision() {return this._ignore_collision}
    set ignore_collision(value) {
        this._ignore_collision = value
        if (!value) {
            this.model.style.pointerEvents = 'auto'
        }
        else {this.model.style.pointerEvents = 'none'}
    }

    get draggable() {return this._draggable}
    set draggable(value) {
        this._draggable = value
        if (value) {
            this.model.style.pointerEvents = 'auto'
        }
        else if (!this._on_click) {
            this.model.style.pointerEvents = 'none'
        }
    }

    animate(variable_name, target_value, duration=.1) {
        // print('animate:', variable_name, target_value)
        if (!this.enabled) {return false}
        let entity = this
        // stop ongoing animation of this varibale
        if (variable_name in entity.setTimeout_calls) {
            for (const id of entity.setTimeout_calls[variable_name]) {
                clearTimeout(id)
                // print('clear:', id)
            }
        }
        entity.setTimeout_calls[variable_name] = []
        let start_value = entity[variable_name]

        for (let i=0; i<=duration*60; i+=1) {
            entity.setTimeout_calls[variable_name].push(
                setTimeout(
                    function anon() {
                        if (!entity.enabled) {
                            return false}
                        var t = i / duration / 60
                        entity[variable_name] = lerp(start_value, target_value, t)
                    },
                    1000*i/60
                )
            )
        }
    }

    fit_to_text() {
        this.model.style.width = 'fit-content'
        this.model.style.height = 'fit-content'
    }

    look_at(target_pos) {
        this.rotation = -(Math.atan2(target_pos[1] - this.y, target_pos[0] - this.x)) * (180/Math.PI)
    }

    destroy_children() {
        for (let _entity of this.children) {
            _entity.el.remove()
        }
        this.children = []
    }
}

function lerp(a, b, t) {
    return ((1-t)*a) + (t*b)
}
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}
random_value = Math.random;

function random_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function random_choice(list) {
    return list[random_int(0, len(list)-1)]
}
function random_color() {
    return rgb(Math.random(), Math.random(), Math.random())
}

function lists_are_equal(array_a, array_b) {
    for (let i=0; i<array_a.length; i++) {
        if (array_a[i] != array_b[i]) {
            return false
        }
    }
    return true
}


class Camera{
  constructor(options=null) {
      this.el = document.createElement('entity')
      _game_window.appendChild(this.el)
      this.el.className = 'entity'
      // this.el.style.height = scene.style.height
      // this.el.style.width = scene.style.width
      this.el.id = 'camera'
      this.children = []
      this._x = 0
      this._y = 0
      this.fov = 1
  }

  get x() {return this._x}
  set x(value) {
      this._x = value
      if (format == 'vertical') {
          scene.style.left = `${50+(-value*100/this.fov)}%`
      }
      else {
          scene.style.left = `${50+(-value*100/asp_x/this.fov)}%`
      }
  }
  get y() {return this._y}
  set y(value) {
      this._y = value
      if (format == 'vertical') {
          scene.style.top = `${50+(value*100*asp_y/this.fov)}%`
      }
      else {
          scene.style.top = `${50+(value*100/this.fov)}%`
      }
  }
  get xy() {return [this._x, this._y]}
  set xy(value) {
      this.x = value[0]
      this.y = value[1]
  }
  get xyz() {return [this._x, this._y, this._z]}
  set xyz(value) {
      this.x = value[0]
      this.y = value[1]
      // this.z = value[2]
  }
  get position() {return this.xyz}
  set position(value) {
      if (value.length == 2) {this.xy = value}
      if (value.length == 3) {this.xy = [value[0], value[1]]}
  }
  get rotation() {return this._rotation}
  set rotation(value) {
      this._rotation = value
      scene.style.transform = `rotate(${-value}deg)`
  }
  get fov() {return self._fov}
  set fov(value) {
      self._fov = value
      scene.style.width = `${1/value*100/asp_x}%`

      if (format == 'vertical') {
          scene.style.height = `${1/value*100/asp_x*asp_y}%`
      }
      else {
          scene.style.height = `${1/value*100/asp_y}%`
      }

  }
}
camera = new Camera({})
camera.ui = new Entity({parent:camera, name:'ui', scale:[1,1], visible_self:false, z:-100, color:color.clear})

class Button extends Entity{
    constructor(options=false) {
        let settings = {parent:camera.ui, scale:[.2,.2], roundness:.2, text_origin:[0,0], }
        for (const [key, value] of Object.entries(options)) {
            settings[key] = value
        }
        super(settings)
    }
}

class Text extends Entity{
    constructor(options=false) {
        let settings = {parent:camera.ui, roundness:.05, padding:.75, z:-1, color:color.clear, scale_x:.8}

        for (const [key, value] of Object.entries(options)) {
            settings[key] = value
        }
        super(settings)
    }
}

function Canvas(options) {
    var e = new Entity(options)
    var canvas = document.createElement('canvas');
    e.el.appendChild(canvas)

    return e
}

function Scene(name='', options=false) {
    settings = {visible_self:false, on_enter:null}
    for (const [key, value] of Object.entries(options)) {
        settings[key] = value
    }
    settings['name'] = name
    _entity = new Entity(settings)
    _entity.bg = new Entity({parent:_entity, scale_y:aspect_ratio})
    _entity.bg.texture = name + '.jpg'
    state_handler.states[name] = _entity
    return _entity
}
class StateHandler {
    constructor (states, fade) {
        camera.overlay = new Entity({parent:camera, name:'overlay', color:color.black, alpha:0, z:-1, scale:[1.1,aspect_ratio*1.1]})
        this.states = states
        this.fade = fade
        this.state = Object.keys(states)[0]
    }

    get state() {return this._state}
    set state(value) {
        if (this.fade && (value != this._state)) {
            camera.overlay.animate('alpha', 1, .1)
            setTimeout(() => {
                camera.overlay.animate('alpha', 0, 1)
                this.hard_state = value
            }, 100)
        }
        else {
            this.hard_state = value
        }
    }
    set hard_state(value) {     // set the state without fading
        // print('set state to:', value)
        for (const [key, entity] of Object.entries(this.states)) {
            if (key == value || value == entity) {
                entity.enabled = true
                if (entity.on_enter) {
                    entity.on_enter()
                }
            }
            else {
                entity.enabled = false}
            }

        this._state = value
    }
}

state_handler = new StateHandler({}, true)

function goto_scene(scene_name, fade=True) {
    if (!fade) {
        state_handler.hard_state = scene_name
        return
    }
    state_handler.state = scene_name
}

class HealthBar extends Entity {
    constructor(options=false) {
        let settings = {min:0, max:100, color:'#222222', bar_color:'bb0505', scale:[.8,.05], roundness:.25}
        for (const [key, value] of Object.entries(options)) {
            settings[key] = value
        }
        super(settings)
        this.bar = new Entity({parent:this, origin:[-.5,0], x:-.5, roundness:.25, scale_x:.25, color:settings['bar_color']})
        this.text_entity = new Entity({parent:this, text:'hii', text_color:'#dddddd', color:color.clear, text_origin:[0,0], text_size:2})
        this.value = settings['max']
    }

    get value() {return this._value}
    set value(value) {
        value = clamp(value, this.min, this.max)
        // print('set value:', value)
        this._value = value
        this.bar.scale_x = value / this.max
        this.text_entity.text = `${value} / ${this.max}`
    }
    get bar_color() {return this.bar.color}
    set bar_color(value) {
        if (this.bar) {
            this.bar.color = value
        }
    }
}
class RainbowSlider extends Entity {
    constructor(options=false) {
        let settings = {min:1, max:5, default:1, color:'#222', scale:[.8,.05], roundness:.25, show_text:false, show_lines:false, gradient:['#CCCCFF', '#6495ED', '#40E0D0', '#9FE2BF', '#28ccaa'], }
        for (const [key, value] of Object.entries(options)) {
            settings[key] = value
        }
        super(settings)
        this.bar = new Entity({parent:this, origin:[-.5,0], x:-.5, roundness:.25, scale_x:.25})
        this.text_entity = new Entity({parent:this, text:'000', text_color:'#ddd', color:color.clear, text_origin:[0,0], text_size:2, enabled:settings['show_text']})
        this.gradient = settings['gradient']
        this.value = settings['default']
        this.active = false
        // this.color = settings['color']

        if (settings['show_lines']) {
            this.texture= 'tile.png'
            this.tileset_size = [1/settings['max'],1]
        }
        this.on_click = function() {
            this.value = int((mouse.point[0]+.5+(1/this.max)) * this.max)
            this.active = true
        }
    }

    update() {
        if (this.active && mouse.left && mouse.hovered_entity === this) {
            this.value = int((mouse.point[0]+.5+(1/this.max)) * this.max)
        }
    }

    input(key) {
        if (key === 'left mouse up') {
          this.active = false
        }
    }

    get value() {return this._value}
    set value(value) {
        value = clamp(value, this.min, this.max)
        this._value = value
        this.bar.scale_x = value / this.max
        this.text_entity.text = `${value} / ${this.max}`
        this.bar.color = this.gradient[clamp(int(value)-1, 0, len(this.gradient)-1)]
        if (this.on_value_changed) {
            this.on_value_changed()
        }
    }
}

class InputField extends Entity {
    constructor(options=false) {
        let settings = {roundness:.5, color:color.smoke, text_size:2, value:''}
        for (const [key, value] of Object.entries(options)) {
            settings[key] = value
        }
        super(settings)
        this.input_field = document.createElement('input')
        this.model.appendChild(this.input_field)
        this.input_field.onkeyup = () => {
            if (this.on_value_changed) {
                this.on_value_changed()
            }
        }
        this.value = settings['value']
    }

    get value() {return this.input_field.value}
    set value(x) {
        if (this.input_field) {
            this.input_field.value = x
        }
    }
}


mouse = {x:0, y:0, position:[0,0], left:false, middle:false, hovered_entity:null,
    set texture(name) {     // TODO: fix this
        document.body.style.cursor = `url('${name}', auto)`
        // print('spegijseofijseofijseiofddddddddddddddddddddddddddddddd', document.body.style)
    }
}

function _mousedown(event) {
    _input(event)
    if (event.button > 0) {
        return
    }
    if (event.pointerType == 'mouse' || event.pointerType == 'touch') {
        mouse.pressure = 1
    }
    // else {
    //     mouse.pressure = event.originalEvent.pressure
    // }
    _update_mouse_position(event)
    _handle_mouse_click(event)
}
document.addEventListener('pointerdown', _mousedown)


time_of_press = 0
function _handle_mouse_click(e) {
    mouse.left = true
    element_hit = document.elementFromPoint(e.pageX - window.pageXOffset, e.pageY - window.pageYOffset);
    entity = entities[element_hit.entity_index]
    // print(element_hit, entity.on_click)
    if (!element_hit || entity === undefined || entity.on_click === undefined) {
        mouse.swipe_start_position = mouse.position
        time_of_press = time
    }

    // print(element_hit)
    if (element_hit && entity) {
        if (entity.on_click) {
            entity.on_click()
        }
        if (entity.draggable) {
            window_position = _game_window.getBoundingClientRect()
            entity.start_offset = [
                ((((e.clientX - window_position.left) / _game_window.clientWidth) - .5) * asp_x*camera.fov) - entity.x,
                (-(((e.clientY - window_position.top) / _game_window.clientHeight ) - .5) / asp_y*camera.fov) - entity.y
                ]
            entity.dragging = true
        }
    }
}

function _mouseup(event) {
    mouse.click_end_position = mouse.position
    if (time - time_of_press < .15) {
        diff_x = mouse.position[0] - mouse.swipe_start_position[0]
        diff_y = mouse.position[1] - mouse.swipe_start_position[1]

        if (diff_x < -.05 && abs(diff_y) < .15) {
            _input('swipe left')
        }
        if (diff_x > .05 && abs(diff_y) < .15) {
            _input('swipe right')
        }
        if (diff_y > .05 && abs(diff_x) < .15) {
            _input('swipe up')
        }
        if (diff_y < -.05 && abs(diff_x) < .15) {
            _input('swipe down')
        }
    }

    _input(event)
    mouse.left = false;
    for (var e of entities) {
        if (e.dragging) {
            e.dragging = false
            if (e.drop) {
                e.drop()
            }
        }
    }
}
document.addEventListener('pointerup', _mouseup)


function _update_mouse_position(event) {
    window_position = _game_window.getBoundingClientRect()
    event_x = event.clientX
    event_y = event.clientY
    mouse.x = (((event_x - window_position.left) / _game_window.clientWidth) - .5) * asp_x
    mouse.y = -(((event_y - window_position.top) / _game_window.clientHeight ) - .5) / asp_y
    mouse.position = [mouse.x, mouse.y]
}

function _onmousemove(event) {
    // print('move')
    _update_mouse_position(event)

    if (!mouse.hovered_entity) {
        mouse.point = null
    }
    else {
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left; //x position within the element.
        var y = event.clientY - rect.top;  //y position within the element.
        mouse.point = [(x/rect.width)-.5, .5-(y/rect.height)]
    }
    element_hit = document.elementFromPoint(event.pageX - window.pageXOffset, event.pageY - window.pageYOffset);
    _entity = entities[element_hit.entity_index]
    if (_entity) {
        mouse.hovered_entity = _entity
    }
    else {
        mouse.hovered_entity = null
    }
    for (var e of entities) {
        if (e.dragging) {
            if (!e.lock_x) {
                // print(mouse.x, e.start_offset[0])
                e.x = mouse.x*camera.fov - e.start_offset[0]
                e.x = clamp(e.x, e.min_x, e.max_x)
                if (e.snap_x) {
                    hor_step = 1 / e.snap_x
                    e.x = round(e.x * hor_step) / hor_step
                }
            }
            if (!e.lock_y) {
                e.y = mouse.y*camera.fov - e.start_offset[1]
                e.y = clamp(e.y, e.min_y, e.max_y)
                if (e.snap_y) {
                    hor_step = 1 / e.snap_y
                    e.y = round(e.y * hor_step) / hor_step
                }
            }
            if (e.while_dragging) {
                // print('d', mouse.position, mouse.point)
                e.while_dragging()
            }
        }
    }
}

document.addEventListener('pointermove', _onmousemove)

// palette = [
//     '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
//     '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
//     ]
// let filter_code = ''
// for (i = 0; i < palette.length; i++) {
//     let rgb = hex_to_rgb(palette[i])
//     let r = rgb.r/255
//     let g = rgb.g/255
//     let b = rgb.b/255
//     let redToBlue = `${r**2.4} 0 0 0 0  ${g**2.4} 0 0 0 0  ${b**2.4} 0 0 0 0  0 0 0 1 0`;
//     filter_code += `
//         <svg xmlns="http://www.w3.org/2000/svg">
//             <filter id="tint_filter_${i}">
//                 <feColorMatrix type="matrix" values="${redToBlue}" />
//             </filter>
//         </svg>
//     `
// }
// filters = document.createElement('div')
// _game_window.appendChild(filters)
// filters.innerHTML = filter_code
// class TintableTile extends Entity {
//     get tint() {return this._tint}
//     set tint(value) {
//         this._tint = value
//         if (value < 16) {
//             this.el.model.style.filter = `url(#tint_filter_${value})`
//         }
//     }
//
// }
timeout_id = 0
function invoke(func, delay) {
    timeout_id = setTimeout(func, delay*1000)
}
function after(delay, func) {
    timeout_id = setTimeout(func, delay*1000)
}
function stop_all_invokes() {
    for (let i = timeout_id; i >= 0; i--) {
        window.clearInterval(i);
    }
}

function distance(a, b) {
    return sqrt((b[0] - a[0])**2 + (b[1] - a[1])**2)
}

function magnitude(vec) {
    const x = vec[0], y = vec[1]
    const magSq = x * x + y * y
    return Math.sqrt(magSq)
}

function normalize(vec) {
    vec_length = magnitude(vec)
    if (vec_length == 0) {
        return vec
    }
    return [vec[0] / vec_length, vec[1] / vec_length]
}

function dot_product(vector1, vector2) {
  let result = 0;
  for (let i = 0; i < vector1-length; i++) {
    result += vector1[i] * vector2[i];
  }
  return result;
}


function sample(population, k){
    if(!Array.isArray(population))
        throw new TypeError("Population must be an array.");
    var n = population.length;
    if(k < 0 || k > n)
        throw new RangeError("Sample larger than population or is negative");

    var result = new Array(k);
    var setsize = 21;   // size of a small set minus size of an empty list

    if(k > 5)
        setsize += Math.pow(4, Math.ceil(Math.log(k * 3) / Math.log(4)))

    if(n <= setsize){
        // An n-length list is smaller than a k-length set
        var pool = population.slice();
        for(var i = 0; i < k; i++){          // invariant:  non-selected at [0,n-i)
            var j = Math.random() * (n - i) | 0;
            result[i] = pool[j];
            pool[j] = pool[n - i - 1];       // move non-selected item into vacancy
        }
    }else{
        var selected = new Set();
        for(var i = 0; i < k; i++){
            var j = Math.random() * n | 0;
            while(selected.has(j)){
                j = Math.random() * n | 0;
            }
            selected.add(j);
            result[i] = population[j];
        }
    }

    return result;
}

function destroy(_entity) {
    if (!_entity) {
        return
    }
    if (_entity._parent && _entity._parent._children) {
        _entity._parent._children.remove(_entity)
    }
    _entity.el.remove()
    //delete _entity
}

function save_system_save(name, value) {localStorage.setItem(name, JSON.stringify(value))}
function save_system_load(name) {try {return JSON.parse(localStorage.getItem(name))} catch (err) {print(err); return false}}
function save_system_clear() {localStorage.clear()}

time = 0
delta_time = 1/60
let start, _prev_time;
update = null
function _step(_timestamp) {
    if (start === undefined) {
        start = _timestamp;
    }
    const elapsed = _timestamp - start;
    if (update) {
        update()
    }

    for (var e of entities) {
        if (e.update && e.enabled) {
            e.update()
        }
    }

    time = _timestamp / 1000
    delta_time = (_timestamp - _prev_time) / 1000
    _prev_time = _timestamp
    window.requestAnimationFrame(_step);
}
window.requestAnimationFrame(_step)


held_keys = {}
all_keys = `<zxcvbnm,.-asdfghjkløæ'qwertyuiopå¨1234567890+`
for (var i = 0; i < all_keys.length; i++) {
    held_keys[all_keys[i]] = 0
}
held_keys['mouse left'] = false
held_keys['mouse middle'] = false
_renamed_keys = {'arrowdown':'down arrow', 'arrowup':'up arrow', 'arrowleft':'left arrow', 'arrowright':'right arrow', ' ':'space'}

input = null
function _input(event) {
    if (event instanceof Event) {
        if (event.type == 'wheel') {
            if (event.deltaY > 0) {key = 'scroll down'}
            else {key = 'scroll up'}
        }
        else if (event.type == 'pointerdown') {
            if (event.button == 0) {key = 'left mouse down'; mouse.left=true; held_keys['mouse left']=true}
            else if (event.button == 1) {key = 'middle mouse down'; mouse.middle=true; held_keys['mouse middle']=true}
            else if (event.button == 2) {key = 'right mouse down'; mouse.right=true; held_keys['mouse right']=true}
        }
        else if (event.type == 'pointerup') {
            if (event.button == 0) {key = 'left mouse up'; mouse.left=false; held_keys['mouse left']=false}
            else if (event.button == 1) {key = 'middle mouse up'; mouse.middle=false; held_keys['mouse middle']=false}
            else if (event.button == 2) {key = 'right mouse up'; mouse.right=false; held_keys['mouse right']=false}
        }

        else {
            key = event.key.toLowerCase()
        }
    }
    else {  // is already a string, like swipe left, etc.
        key = event
    }

    if (key in _renamed_keys) {
        key = _renamed_keys[key]
    }

    if ((event instanceof Event) && event.type == "keyup") {
        held_keys[key] = 0
        key = key + ' up'
    }
    else if (!held_keys[key]){
        held_keys[key] = 1
    }
    else if (event.type == "keydown") {  // prevent key repeat
        return
    }


    for (var e of entities) {
        if (e.input && e.enabled) {
            e.input(key)
        }
    }
    if (input) {
        input(key)
    }
}
document.addEventListener('keydown', _input)
document.addEventListener('keyup', _input)
document.addEventListener('wheel', _input); // modern desktop


// triple click in the lower right to enter fullscreen
_hidden_fullscreen_button = new Button({parent:camera.ui, xy:bottom_right, roundness:.5, color:color.red, last_pressed_timestamp:-1, sequential_taps:0, visible_self:false})
_hidden_fullscreen_button.on_click = function() {
    // print(time - _hidden_fullscreen_button.last_pressed_timestamp)
    if (time - _hidden_fullscreen_button.last_pressed_timestamp < .25) {
        _hidden_fullscreen_button.sequential_taps += 1
        if (_hidden_fullscreen_button.sequential_taps >= 3) {
            set_fullscreen(!fullscreen)
            _hidden_fullscreen_button.sequential_taps = 0
        }
    }
    else {  //reset
        _hidden_fullscreen_button.sequential_taps = 1
    }
    _hidden_fullscreen_button.last_pressed_timestamp = time
}

function _fullscreenchange() {
    set_scale(1)
}
document.addEventListener('fullscreenchange', _fullscreenchange)

set_orientation('vertical')
