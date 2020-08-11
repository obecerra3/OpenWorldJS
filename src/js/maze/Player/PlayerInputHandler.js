//Control State currently handles input for the player and holds the state of the player's movement status.
//this can be changed to be a subject that the player observes perhaps?

define(["pointerLockControls", "camera", "container", "scene", "three", "utils", "debug"],
(PointerLockControls, camera, container, scene, THREE, Utils, Debug) =>
{
    // move mask:
    // none : 0
    // left : 1
    // right : 2
    // up : 4
    // down : 8

    var PlayerInput =
    {
        controls: new PointerLockControls(camera, container),
        clock: {},
        orbit_enabled: false,
        move_forward: false,
        move_backward: false,
        move_left: false,
        move_right: false,
        move_mask: 0,
        speed: Utils.ORBIT_SPEED,
        speed_delta: Utils.ORBIT_SPEED_DELTA,
        is_crouched: false,
        is_jumping: false,
        space_pressed: false,

        // Callbacks defined in Player and Terrain, Command Pattern
        toggleFlashlight: null,
        toggleCrouch: null,
        toggleJump: null,
        printState: null,
        toggleRun: null,
        toggleGravity : null,
        toggleFast : null,
        toggleZeroVelocity : null,
        toggleFirstPerson : null,
        toggleAlpha : null,
        toggleShowRays : null,

        init: (_clock) =>
        {
            PlayerInput.clock = _clock;

            document.getElementById("command_console").addEventListener('change', (event) =>
            {
                switch (event.target.value)
                {
                    case ('run0'):
                        PlayerInput.toggleFast(false);
                        break;
                    case ('run1'):
                        PlayerInput.toggleFast(true);
                        break;
                    case ('orb0'):
                        PlayerInput.speed = Utils.ORBIT_SPEED;
                        PlayerInput.speed_delta = Utils.ORBIT_SPEED_DELTA;
                        break;
                    case ('orb1'):
                        PlayerInput.speed = Utils.ORBIT_SPEED_FAST;
                        PlayerInput.speed_delta = Utils.ORBIT_SPEED_DELTA_FAST;
                        break;
                    case ('v0'):
                        PlayerInput.toggleZeroVelocity();
                        break;
                    case ('g0'):
                        PlayerInput.toggleGravity(0);
                        break;
                    case ('g1'):
                        PlayerInput.toggleGravity(1);
                        break;
                    case ('g2'):
                        PlayerInput.toggleGravity(2);
                        break;
                    case ('ta0'):
                        PlayerInput.toggleAlpha(0.5);
                        break;
                    case ('ta1'):
                        PlayerInput.toggleAlpha(1.0);
                        break;
                    case ('ad0'):
                        Debug.toggleAmmoDrawer(false);
                        break;
                    case ('ad1'):
                        Debug.toggleAmmoDrawer(true);
                        break;
                    case ('ray0'):
                        PlayerInput.toggleShowRays(false);
                        break;
                    case ('ray1'):
                        PlayerInput.toggleShowRays(true);
                        break;
                }
            });

            container.addEventListener("click", () =>
            {
                PlayerInput.controls.lock();
            }, false);

            // PlayerInput.controls.addEventListener("lock", () =>
            // {
            //     //resume game
            //     container.style.display = "none";
            // });
            //
            // PlayerInput.controls.addEventListener("unlock", () =>
            // {
            //     //pause game
            //     container.style.display = "block";
            // });

            scene.add(PlayerInput.controls.getObject());

            document.addEventListener('keydown', (event) =>
            {
                if (PlayerInput.controls.isLocked)
                {
                    if (PlayerInput.orbit_enabled)
                    {
                        //ORBIT CONTROLS USED FOR DEBUGGING
                        switch (event.keyCode)
                        {
                            case 38: //w
                            case 87: //forward arrow
                                var offset = PlayerInput.controls.getDirection(new THREE.Vector3());
                                camera.position.add(offset.multiplyScalar(PlayerInput.speed));
                                break;
                            case 40: //s
                            case 83: //backward arrow
                                var offset = PlayerInput.controls.getDirection(new THREE.Vector3());
                                camera.position.add(offset.multiplyScalar(-PlayerInput.speed));
                                break;
                            case 39: // right
                            case 68: // d
                                var offset = PlayerInput.controls.getDirection(new THREE.Vector3());
                                offset.cross(new THREE.Vector3(0, 0, 1));
                                camera.position.add(offset.multiplyScalar(PlayerInput.speed));
                                break;
                            case 37: // left
                            case 65: // a
                                var offset = PlayerInput.controls.getDirection(new THREE.Vector3());
                                offset.cross(new THREE.Vector3(0, 0, 1));
                                camera.position.add(offset.multiplyScalar(-PlayerInput.speed));
                                break;
                            case 49: //1
                                PlayerInput.speed -= PlayerInput.speed_delta;
                                break;
                            case 57: //9
                                PlayerInput.speed += PlayerInput.speed_delta;
                                break;
                            case 48: //0
                                PlayerInput.orbit_enabled = !PlayerInput.orbit_enabled;
                                break;
                        }
                    }
                    else
                    {
                        //REGULAR CONTROLS
                        switch (event.keyCode)
                        {
                            case 70: //f
                                PlayerInput.toggleFlashlight();
                                break;
                            case 67: //c
                                if (!PlayerInput.is_crouched)
                                {
                                    PlayerInput.toggleCrouch();
                                    PlayerInput.is_crouched = true;
                                }
                                break;
                            case 16: //shift
                                PlayerInput.toggleRun(true);
                                break;
                            case 37: // left
                            case 65: // a
                                if (!PlayerInput.move_left) PlayerInput.move_mask += 1;
                                PlayerInput.move_left = true;
                                break;
                            case 39: // right
                            case 68: // d
                                if (!PlayerInput.move_right) PlayerInput.move_mask += 2;
                                PlayerInput.move_right = true;
                                break;
                            case 38: // up
                            case 87: // w
                                if (!PlayerInput.move_forward) PlayerInput.move_mask += 4;
                                PlayerInput.move_forward = true;
                                break;
                            case 40: // down
                            case 83: // s
                                if (!PlayerInput.move_backward) PlayerInput.move_mask += 8;
                                PlayerInput.move_backward = true;
                                break;
                            case 32: // space
                                if (!PlayerInput.space_pressed)
                                {
                                    PlayerInput.toggleJump();
                                    PlayerInput.space_pressed = true;
                                }
                                break;
                            case 80: // p
                                PlayerInput.printState();
                                break;
                            case 48: //0
                                PlayerInput.orbit_enabled = !PlayerInput.orbit_enabled;
                                break;
                            case 71: //g
                                PlayerInput.toggleGravity();
                                break;
                            case 88: // x
                                PlayerInput.toggleFirstPerson();
                                break;
                        }
                    }
                }
            }, false);

            document.addEventListener('keyup', (event) =>
            {
                if (PlayerInput.controls.isLocked && !PlayerInput.orbit_enabled)
                {
                    switch (event.keyCode)
                    {
                        case 16: //shift
                            PlayerInput.toggleRun(false);
                            break;
                        case 67: //c
                            PlayerInput.is_crouched = false;
                            break;
                        case 37: // left
                        case 65: // a
                            PlayerInput.move_mask -= 1;
                            PlayerInput.move_left = false;
                            break;
                        case 39: // right
                        case 68: // d
                            PlayerInput.move_mask -= 2;
                            PlayerInput.move_right = false;
                            break;
                        case 38: // up
                        case 87: // w
                            PlayerInput.move_mask -= 4;
                            PlayerInput.move_forward = false;
                            break;
                        case 40: // down
                        case 83: // s
                            PlayerInput.move_mask -= 8;
                            PlayerInput.move_backward = false;
                            break;
                        case 32: // space
                            PlayerInput.space_pressed = false;
                            break;
                    }
                }
            }, false);
        },

    };
    return PlayerInput;
});
