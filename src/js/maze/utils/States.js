//class similar to an enum meant to hold the states for animated characters (the player, enemies, animals, npcs)
define([], () =>
{
    var States =
    {
        IDLE: "Idle",
        DEAD: "Dead",
        WALK: "Walk",
        RUN: "Run",
        JUMP: "Jump",
        FALL_IDLE: "FallIdle",
        CROUCH_IDLE: "CrouchIdle",
        CROUCH_WALK: "CrouchWalk",
        SLIDE: "Slide"
    };
    return States;
});
