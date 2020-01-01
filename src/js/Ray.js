
class Ray {
    constructor(scene, direction, length = 1, groundChecker = false, originOffset = new THREE.Vector3(0, 0, 0), color = 0x0000ff) {
        this.originOffset = originOffset;
        this.direction = direction.normalize();
        this.length = length;
        this.helperRay = new THREE.ArrowHelper(this.direction, new THREE.Vector3(0, 0, 0), this.length, color);
        this.helperRay.visible = false;
        scene.add(this.helperRay);
        this.visible = false;
        this.groundChecker = groundChecker;
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
