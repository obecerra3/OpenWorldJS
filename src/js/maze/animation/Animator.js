// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html

define(["three"], (THREE) =>
{
    var Animator =
    {
        mixer: {},
        animation_data: {},
        clock: new THREE.Clock(),

        init: (_mixer, _animation_data) =>
        {
            mixer = _mixer;
            animation_data = _animation_data;
            animation_data.Idle.action.play();
        },

        update: () =>
        {
            mixer.update(clock.getDelta());
        },

        prepareCrossFade: (_start_key, _end_key, _duration, _sync_time = 0) =>
        {
            togglePause(false);

            if (_sync_time > 0) {
                synchronizeCrossFade(_start_key, _end_key, _duration, _sync_time);
            } else {
                executeCrossFade(_start_key, _end_key, _duration);
            }
        },

        synchronizeCrossFade: (_start_key, _end_key, _duration, _sync_time) =>
        {
            animation_data[_start_key].action.setDuration(_sync_time);
            var onLoopFinished = (event) =>
            {
                if (event.action === animation_data[_start_key].action)
                {
                    mixer.removeEventListener('loop', onLoopFinished);
                    executeCrossFade(_start_key, _end_key, _duration);
                }
            }
            mixer.addEventListener('loop', onLoopFinished);
        },

        executeCrossFade: (_start_key, _end_key, _duration) =>
        {
            // Not only the start action, but also the end action must get a weight of 1 before fading
            // (concerning the start action this is already guaranteed in this place)
            var end_action = animation_data[_end_key].action;
            var start_action = animation_data[_start_key].action;
            setWeight(end_action, 1);
            end_action.time = 0;
            // Crossfade with warping - you can also try without warping by setting the third parameter to false
            start_action.crossFadeTo(end_action, _duration, true);
            end_action.play();
        },

        // This is needed, since animationAction.crossFadeTo() disables its start action and sets
        // the start action's timeScale to ((start animation's duration) / (end animation's duration))
        setWeight: (_action, _weight) =>
        {
            _action.enabled = true;
            _action.setEffectiveTimeScale(1);
            _action.setEffective_weight(_weight);
        },

        playAnimation: (_key, _weight = 1, _fade_in_duration = 0.5) =>
        {
            togglePause(false);
            var action = animation_data[_key].action;
            setWeight(action, _weight);
            action.time = 0;
            action.fadeIn(_fade_in_duration);
            action.play();
        },

        stopAnimation: (_key, _weight = 0, _fade_out_duration = 0.5) =>
        {
            var action = animation_data[_key].action;
            setWeight(action, _weight);
            action.fadeOut(_fade_out_duration);
            action.stop();
        },

        togglePause: (_value) =>
        {
            for (var key of Object.keys(animation_data)) {
                animation_data[key].paused = _value;
            }
        },

        activateAllActions: () =>
        {
            var current_action;
            for (var key of Object.keys(animation_data)) {
                current_action = animation_data[key].action
                setWeight(current_action, animation_data[key].weight);
                current_action.play();
            }
        },

        deactivateAllActions: () =>
        {
            for (var key of Object.keys(animation_data)) {
                animation_data[key].action.stop();
            }
        },
    };
    return Animator;
});
