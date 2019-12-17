var Three = require('three');
var Utils = require('./Utils.js');

class Collider {

    constructor (player, rays, groundRayCount) {
        this.raycaster = new Three.Raycaster(new Three.Vector3(), new Three.Vector3(), 0, 1);
        this.rays = rays;
        this.meshes = {};
        this.showRays = false;
        this.state = player.state;
        this.groundRayCount = groundRayCount;
    }

    toggleShowRays (value) {
        this.showRays = value;
        this.rays.forEach((ray) => {
            ray.toggleVisible(value);
        });
    }

    addMesh (key, value) {
        this.meshes[key] = value;
    }

    update (player) {
        for (var key of Object.keys(this.meshes)) {
            this.collide(player, this.meshes[key]);
        }

        if (this.showRays) {
            this.rays.forEach((ray) => {
                let origin = new Three.Vector3(0, 7, 0);
                origin.add(player.body.position);
                origin.add(ray.originOffset);
                ray.update(origin);
            });
        }
    }

    isGrounded (player) {
        let intersections = [];
        for (var key of Object.keys(this.meshes)) {
            let mesh = this.meshes[key];
            this.rays.forEach((ray) => {
                if (ray.groundChecker) {
                    this.raycaster.far = ray.length;
                    this.raycaster.ray.origin.copy(player.body.position);
                    this.raycaster.ray.origin.y = 10;
                    this.raycaster.ray.origin.add(ray.originOffset);
                    this.raycaster.ray.direction.copy(ray.direction);
                    intersections = intersections.concat(this.raycaster.intersectObject(mesh));
                }
            });
        }

        console.log("intersections: ", intersections);

        if (intersections.length > Math.ceil(this.groundRayCount / 2)) {
            return true;
        }
        return false;
    }

    collide (player, mesh) {
        let intersections = [];

        this.rays.forEach((ray) => {
            if (!ray.groundChecker) {
                this.raycaster.far = ray.length;
                this.raycaster.ray.origin.copy(player.body.position);
                this.raycaster.ray.origin.y = 10;
                this.raycaster.ray.origin.add(ray.originOffset);
                this.raycaster.ray.direction.copy(ray.direction);
                intersections = intersections.concat(this.raycaster.intersectObject(mesh));
            }
        });

        if (intersections.length > 0) {
            if (intersections.length == 3) { // special cases (read: dumb hack)
                intersections.sort((x,y) => x.distance > y.distance);
                intersections.slice(0,2).forEach((x) => {
                    if (x.face.normal.dot(player.velocity) < 0) {
                        player.velocity.projectOnPlane(x.face.normal);
                    }
                });
            } else if (intersections.length == 5) {
                intersections.sort((x,y)=>x.distance > y.distance);
                intersections.slice(0,3).forEach((x) => {
                    if (x.face.normal.dot(player.velocity) < 0) {
                        player.velocity.projectOnPlane(x.face.normal);
                    }
                });
            } else {
                intersections.forEach((x) => {
                    if (x.face.normal.dot(player.velocity) < 0) {
                        player.velocity.projectOnPlane(x.face.normal);
                    }
                });
            }
        }
    }
}

module.exports = Collider;
