var Three = require('three');

class Collider {

    constructor (player, playerSize, stateRayData) {
        this.raycaster = new Three.Raycaster(new Three.Vector3(), new Three.Vector3(), 0, playerSize);
        this.stateRayData = stateRayData;
        this.player = player;
        this.meshes = {};
        this.helperRays = {};
        this.showRays = true;
        this.state = this.player.state;
        this.initHelperRays();
    }

    initHelperRays () {
        let rays = []
        for (var key of Object.keys(this.stateRayData)) {
            for (var i = 0; i < this.stateRayData[key]; i++) {
                rays[i] = new Three.ArrowHelper(this.stateRayData[key][i], this.player.position, 1, 0x00ff00);
                this.player.worldState.scene.add(rays[i]);
            }

            this.helperRays[key] = rays;
            rays = [];
        }
    }

    toggleShowRays (value) {
        this.showRays = value;

        if (!value) {
            this.toggleHelperRays(this.state, false);
        }
    }

    toggleHelperRays (state, value) {
        this.helperRays[state].forEach((ray) => {
            ray.visible = value;
        });
    }

    addMesh (key, value) {
        console.log(key);
        console.log(value);
        this.meshes[key] = value;
    }

    update () {
        if (this.showRays) {
            if (this.state != this.player.state) {
                this.toggleHelperRays(this.state, false);
                this.toggleHelperRays(this.player.state, true);
            }
        }

        for (var key of Object.keys(this.meshes)) {
            this.collide(this.player, this.meshes[key]);
        }

        this.state = this.player.state;
    }

    collide (player, mesh) {
        var intersections = [];
        this.raycaster.ray.origin.copy(player.body.position);
        this.stateRayData[this.state].forEach((ray) => {
            this.raycaster.ray.direction.copy(ray);
            intersections = intersections.concat(this.raycaster.intersectObject(mesh));
        });
        // this.raycaster.ray.direction.copy(XZ);
        // intersections = intersections.concat(this.raycaster.intersectObject(mesh));
        // this.raycaster.ray.direction.copy(X_Z);
        // intersections = intersections.concat(this.raycaster.intersectObject(mesh));
        // this.raycaster.ray.direction.copy(_XZ);
        // intersections = intersections.concat(this.raycaster.intersectObject(mesh));
        // this.raycaster.ray.direction.copy(_X_Z);
        // intersections = intersections.concat(this.raycaster.intersectObject(mesh));


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
