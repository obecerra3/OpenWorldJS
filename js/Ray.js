var Three = require('three');
var Utils = require('./Utils.js');

class Ray {
    constructor(scene, direction, length = 1, originOffset = new Three.Vector3(0, 0, 0), color = 0x0000ff) {
        this.originOffset = originOffset;
        this.direction = direction.normalize();
        this.length = length;
        this.color = color;
        this.helperRay = new Three.ArrowHelper(this.direction, new Three.Vector3(0, 0, 0), this.length, this.color);
        this.helperRay.visible = false;
        scene.add(this.helperRay);
        this.visible = false;
    }

    update(origin) {
        if (this.visible) {
            this.helperRay.position.copy(origin);
        }
    }

    toggleVisible(value) {
        this.visible = value;
        this.helperRay.visible = value;
    }
}

module.exports = Ray;
