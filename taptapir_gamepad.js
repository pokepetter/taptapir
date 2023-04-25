gamepad_key_mappings = [
    'a', 'b', 'x', 'y',
    'left shoulder', 'right shoulder', null, null,
    'back', 'start', 'left stick', 'right stick',
    'dpad up', 'dpad down', 'dpad left', 'dpad right'
]
gamepad_axes_names = ['left stick x', 'left stick y', 'right stick x', 'right stick y']

for (var key of gamepad_key_mappings) {
    held_keys['gamepad ' + key] = 0
}
for (var key of gamepad_axes_names) {
    held_keys['gamepad ' + key] = 0
}


function gamepad_update() {
    gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

    for (var i = 0; i < gamepads.length; i++) {
        let gamepad = gamepads[i]
        if (!gamepad) {
            i++
            continue
        }
        // Process buttons
        for (let bi = 0; bi < gamepad_key_mappings.length; bi++) {

            if (gamepad.buttons[bi].value === 1 && !held_keys['gamepad ' + gamepad_key_mappings[bi]]) {
                if (gamepad_key_mappings[bi]) {
                    // console.log('gamepad ' + gamepad_key_mappings[bi])
                    _input('gamepad ' + gamepad_key_mappings[bi])
                }
                // else {
                //     console.log('unknown:', bi, gamepad.buttons[bi].value)
                // }
            }
            else if (gamepad.buttons[bi].value === 0 && held_keys['gamepad ' + gamepad_key_mappings[bi]]) {
                if (gamepad_key_mappings[bi]) {
                    // console.log('gamepad ' + gamepad_key_mappings[bi] + ' up')
                    _input('gamepad ' + gamepad_key_mappings[bi] + ' up')
                }
            }
            held_keys['gamepad ' + gamepad_key_mappings[bi]] = gamepad.buttons[bi].value
        }
        // Process axes
        for (let ai = 0; ai < gamepad.axes.length; ai++) {
            value = gamepad.axes[ai]
            if (Math.abs(value) < .1) {
                value = 0
            }
            if (ai == 1 || ai == 3) { // flip y axis
                value = - value
            }
            // else {
            //     console.log(ai, value)
            // }
            held_keys['gamepad ' + gamepad_axes_names[ai]] = value
        }
    }
    requestAnimationFrame(gamepad_update)
}
requestAnimationFrame(gamepad_update)
