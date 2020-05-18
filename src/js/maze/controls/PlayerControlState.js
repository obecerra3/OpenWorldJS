//Control State currently handles input for the player and holds the state of the player's movement status.
//this can be changed to be a subject that the player observes perhaps?

define(["pointerLockControls", "camera", "container", "scene", "maze"], (PointerLockControls, camera, container, scene, maze) =>
{
    var PlayerControlState =
    {
        controls: new PointerLockControls(camera, container),
        orbit_enabled: false,
        move_forward: false,
        move_backward: false,
        move_left: false,
        move_right: false,
        speed: 40,
        space_pressed_time_elapsed: null, //should be initialized to null
        clock: maze.clock,
        is_crouched: false,
        is_jumping: false,

        // Callbacks defined in Player.js, example of Command Pattern
        toggleFlashlight: null,
        toggleCrouch: null,
        toggleJump: null,
        printState: null,
        toggleFlight: null,
        toggleRun: null,

        init: () =>
        {
            container.addEventListener("click", () =>
            {
                controls.lock();
            }, false);

            controls.addEventListener("lock", () =>
            {
                container.style.display = "none";
            });

            controls.addEventListener("unlock", () =>
            {
                container.style.display = "block";
            });

            scene.add(controls.getObject());

            document.addEventListener('keydown', (event) => {
                if (controls.isLocked) {
                    if (orbit_enabled) {
                        //ORBIT CONTROLS USED FOR DEBUGGING
                        let offset = new THREE.Vector3();
                        switch (event.keyCode) {
                            case 38: //w
                            case 87: //forward arrow
                                offset = controls.getDirection(new THREE.Vector3())
                                worldState.camera.position.add(offset.multiplyScalar(speed));
                                break;
                            case 40: //s
                            case 83: //backward arrow
                                offset = controls.getDirection(new THREE.Vector3())
                                worldState.camera.position.add(offset.multiplyScalar(-speed));
                                break;
                            case 49: //1
                                speed -= 5;
                                break;
                            case 57: //9
                                speed += 5;
                                break;
                            case 48: //0
                                orbit_enabled = !orbit_enabled;
                                break;
                        }
                    } else {
                        //REGULAR CONTROLS
                        switch (event.keyCode) {
                            case 70: //f
                                toggleFlashlight();
                                break;
                            case 67: //c
                                if (!is_crouched) {
                                    toggleCrouch();
                                    is_crouched = true;
                                }
                                break;
                            case 16: //shift
                                toggleRun(true);
                                break;
                            case 38: // up
                            case 87: // w
                                move_forward = true;
                                break;
                            case 37: // left
                            case 65: // a
                                move_left = true;
                                break;
                            case 40: // down
                            case 83: // s
                                move_backward = true;
                                break;
                            case 39: // right
                            case 68: // d
                                move_right = true;
                                break;
                            case 32: // space
                                if (!space_pressed_time_elapsed) {
                                    space_pressed_time_elapsed = clock.elapsedTime;
                                    toggleJump(0);
                                }
                                break;
                            case 80: // p
                                printState();
                                break;
                            case 79: // o
                                toggleFlight();
                                break;
                            case 48: //0
                                orbit_enabled = !orbit_enabled;
                                break;
                        }
                    }
                }
            }, false);

            document.addEventListener('keyup', (event) => {
                if (controls.isLocked && !orbit_enabled) {
                    switch (event.keyCode) {
                        case 16: //shift
                            toggleRun(false);
                            break;
                        case 67: //c
                            is_crouched = false;
                            break;
                        case 38: // up
                        case 87: // w
                            move_forward = false;
                            break;
                        case 37: // left
                        case 65: // a
                            move_left = false;
                            break;
                        case 40: // down
                        case 83: // s
                            move_backward = false;
                            break;
                        case 39: // right
                        case 68: // d
                            move_right = false;
                            break;
                        case 32: //space
                            toggleJump(clock.elapsedTime - space_pressed_time_elapsed);
                            space_pressed_time_elapsed = null;
                            break;
                    }
                }
            }, false);
        },

    };
    return PlayerControlState;
});
