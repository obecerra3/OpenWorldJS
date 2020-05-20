//Control State currently handles input for the player and holds the state of the player's movement status.
//this can be changed to be a subject that the player observes perhaps?

define(["pointerLockControls", "camera", "container", "scene", "three"], (PointerLockControls, camera, container, scene, THREE) =>
{
    var PlayerInput =
    {
        controls: new PointerLockControls(camera, container),
        orbit_enabled: false,
        move_forward: false,
        move_backward: false,
        move_left: false,
        move_right: false,
        speed: 40,
        space_pressed_time_elapsed: null, //should be initialized to null
        clock: new THREE.Clock(),
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
                PlayerInput.controls.lock();
            }, false);

            PlayerInput.controls.addEventListener("lock", () =>
            {
                container.style.display = "none";
            });

            PlayerInput.controls.addEventListener("unlock", () =>
            {
                container.style.display = "block";
            });

            scene.add(PlayerInput.controls.getObject());

            document.addEventListener('keydown', (event) => {
                if (PlayerInput.controls.isLocked) {
                    if (PlayerInput.orbit_enabled) {
                        //ORBIT CONTROLS USED FOR DEBUGGING
                        let offset = new THREE.Vector3();
                        switch (event.keyCode) {
                            case 38: //w
                            case 87: //forward arrow
                                offset = PlayerInput.controls.getDirection(new THREE.Vector3())
                                camera.position.add(offset.multiplyScalar(PlayerInput.speed));
                                break;
                            case 40: //s
                            case 83: //backward arrow
                                offset = PlayerInput.controls.getDirection(new THREE.Vector3())
                                camera.position.add(offset.multiplyScalar(-PlayerInput.speed));
                                break;
                            case 49: //1
                                PlayerInput.speed -= 5;
                                break;
                            case 57: //9
                                PlayerInput.speed += 5;
                                break;
                            case 48: //0
                                PlayerInput.orbit_enabled = !PlayerInput.orbit_enabled;
                                break;
                        }
                    } else {
                        //REGULAR CONTROLS
                        switch (event.keyCode) {
                            case 70: //f
                                PlayerInput.toggleFlashlight();
                                break;
                            case 67: //c
                                if (!PlayerInput.is_crouched) {
                                    PlayerInput.toggleCrouch();
                                    PlayerInput.is_crouched = true;
                                }
                                break;
                            case 16: //shift
                                PlayerInput.toggleRun(true);
                                break;
                            case 38: // up
                            case 87: // w
                                PlayerInput.move_forward = true;
                                break;
                            case 37: // left
                            case 65: // a
                                PlayerInput.move_left = true;
                                break;
                            case 40: // down
                            case 83: // s
                                PlayerInput.move_backward = true;
                                break;
                            case 39: // right
                            case 68: // d
                                PlayerInput.move_right = true;
                                break;
                            case 32: // space
                                if (!PlayerInput.space_pressed_time_elapsed) {
                                    PlayerInput.space_pressed_time_elapsed = PlayerInput.clock.elapsedTime;
                                    PlayerInput.toggleJump(0);
                                }
                                break;
                            case 80: // p
                                PlayerInput.printState();
                                break;
                            case 79: // o
                                PlayerInput.toggleFlight();
                                break;
                            case 48: //0
                                PlayerInput.orbit_enabled = !PlayerInput.orbit_enabled;
                                break;
                        }
                    }
                }
            }, false);

            document.addEventListener('keyup', (event) => {
                if (PlayerInput.controls.isLocked && !PlayerInput.orbit_enabled) {
                    switch (event.keyCode) {
                        case 16: //shift
                            PlayerInput.toggleRun(false);
                            break;
                        case 67: //c
                            PlayerInput.is_crouched = false;
                            break;
                        case 38: // up
                        case 87: // w
                            PlayerInput.move_forward = false;
                            break;
                        case 37: // left
                        case 65: // a
                            PlayerInput.move_left = false;
                            break;
                        case 40: // down
                        case 83: // s
                            PlayerInput.move_backward = false;
                            break;
                        case 39: // right
                        case 68: // d
                            PlayerInput.move_right = false;
                            break;
                        case 32: //space
                            PlayerInput.toggleJump(PlayerInput.clock.elapsedTime - PlayerInput.space_pressed_time_elapsed);
                            PlayerInput.space_pressed_time_elapsed = null;
                            break;
                    }
                }
            }, false);
        },

    };
    return PlayerInput;
});
