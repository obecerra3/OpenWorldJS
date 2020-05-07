//https://github.com/felixmariotto/three-screenshake/blob/master/ScreenShake.js

class ScreenShake {
    constructor (camera) {
        this.camera = camera;
        this.enabled = false;
        this.toggled = false;
        this.intensity = 0;
        this.duration = 0;
        this.startStamp = 0;
        this.endStamp = 0;
    }

    endShake () {
        this.enabled = false;
        this.toggled = false;
    }

    update (camera) {
        if (this.enabled) {
            const now = Date.now();
            if (this._timestampEnd > now || this.toggled) {
                let interval = (Date.now() - this._timestampStart) /
                            (this._timestampEnd - this._timestampStart);
                this.computePosition(camera, interval);
            } else {
                camera.position.copy(this._startPoint);
                this.enabled = false;
            };
        };
    }

    // This initialize the values of the shaking.
    // vecToAdd param is the offset of the camera position at the climax of its wave.
    shake (camera, vecToAdd, seconds, toggled = false) {
        this.enabled = true ;
        this._timestampStart = Date.now();
        let milliseconds = seconds * 1000;
        this._timestampEnd = this._timestampStart + milliseconds;
        this._startPoint = new THREE.Vector3().copy(camera.position);
        this._endPoint = new THREE.Vector3().addVectors(camera.position, vecToAdd);
        this.toggled = toggled;
    }

    computePosition (camera, interval) {
        // This creates the wavy movement of the camera along the interval.
        // The first bloc call this.getQuadra() with a positive indice between
        // 0 and 1, then the second call it again with a negative indice between
        // 0 and -1, etc. Variable position will get the sign of the indice, and
        // get wavy.
        if (interval < 0.4) {
            var position = this.getQuadra( interval / 0.4 );
        } else if (interval < 0.7) {
            var position = this.getQuadra( (interval-0.4) / 0.3 ) * -0.6;
        } else if (interval < 0.9) {
            var position = this.getQuadra( (interval-0.7) / 0.2 ) * 0.3;
        } else {
            var position = this.getQuadra( (interval-0.9) / 0.1 ) * -0.1;
        }

        // Here the camera is positioned according to the wavy 'position' variable.
        camera.position.lerpVectors( this._startPoint, this._endPoint, position );
    }

    // This is a quadratic function that return 0 at first, then return 0.5 when t=0.5,
    // then return 0 when t=1 ;
    getQuadra (t) {
        return 9.436896e-16 + (4*t) - (4*(t*t)) ;
    }
}

module.exports = ScreenShake;
