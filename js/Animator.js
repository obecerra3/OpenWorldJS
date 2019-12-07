// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html

var Three = require('three');
var Utils = require('./Utils.js')

class Animator {
    constructor(mixer, animationData) {
        this.mixer = mixer;
        this.animationData = animationData;
        this.clock = new Three.Clock();

        //start everything in idle state
        this.animationData.Idle.action.play();
    }

    deactivateAllActions() {
        for (var key of Object.keys(this.animationData)) {
            this.animationData[key].action.stop();
        }
    }

    activateAllActions() {
        for (var key of Object.keys(this.animationData)) {
            var currentAction = this.animationData[key].action
            this.setWeight(currentAction, this.animationData[key].weight);
            currentAction.play();
        }
    }

    togglePause(value) {
        for (var key of Object.keys(this.animationData)) {
            this.animationData[key].paused = value;
        }
    }

    prepareCrossFade(startKey, endKey, duration) {
        console.log("\nprepareCrossFade");
        this.togglePause(false);
        this.executeCrossFade(startKey, endKey, duration);
        // if (this.animationData[startKey].duration >= Utils.DURATION_THRESHOLD) {
        //     this.executeCrossFade(startKey, endKey, duration);
        // } else {
        //     this.synchronizeCrossFade(startKey, endKey, duration);
        // }
    }

    synchronizeCrossFade(startKey, endKey, duration) {
        console.log("synchronizeCrossFade");
        let onLoopFinished = (event) => {
            if (event.action === this.animationData[startKey].action) {
                this.mixer.removeEventListener('loop', onLoopFinished);
                this.executeCrossFade(startKey, endKey, duration);
            }
        }
        this.mixer.addEventListener('loop', onLoopFinished);

    }

    executeCrossFade(startKey, endKey, duration) {
        console.log("executeCrossFade");
        // Not only the start action, but also the end action must get a weight of 1 before fading
        // (concerning the start action this is already guaranteed in this place)
        let endAction = this.animationData[endKey].action;
        let startAction = this.animationData[startKey].action;
        this.setWeight(endAction, 1);
        endAction.time = 0;
        // Crossfade with warping - you can also try without warping by setting the third parameter to false
        startAction.crossFadeTo(endAction, duration, true);
        endAction.play();
    }

    // This is needed, since animationAction.crossFadeTo() disables its start action and sets
    // the start action's timeScale to ((start animation's duration) / (end animation's duration))
    setWeight(action, weight) {
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
    }

    animate() {
        this.mixer.update(this.clock.getDelta());
    }

}

module.exports = Animator;
