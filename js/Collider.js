var Three = require('three');
var Utils = require('./Utils.js');

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
            for (var i = 0; i < this.stateRayData[key].length; i++) {
                rays[i] = new Three.ArrowHelper(this.stateRayData[key][i], this.player.body.position, Utils.PLAYER_SIZE, 0x00ff00);
                rays[i].visible = false;
                this.player.worldState.scene.add(rays[i]);
            }
            this.helperRays[key] = rays;
            rays = [];
        }
    }

    toggleShowRays (value) {
        this.showRays = value;
    }

    toggleHelperRays (state, value) {
        this.helperRays[state].forEach((ray) => {
            ray.position.copy(this.player.body.position);
            ray.position.y = 10;
            ray.visible = value;
        });
    }

    addMesh (key, value) {
        this.meshes[key] = value;
    }

    update () {
        if (this.state != this.player.state) {
            this.toggleHelperRays(this.state, false);
            this.state = this.player.state;
        }

        this.toggleHelperRays(this.state, this.showRays);

        for (var key of Object.keys(this.meshes)) {
            this.collide(this.player, this.meshes[key]);
        }
    }

    collide (player, mesh) {
        var intersections = [];

        this.raycaster.ray.origin.copy(player.body.position);
        this.raycaster.ray.origin.y = 10;
        this.stateRayData[this.state].forEach((ray) => {
            this.raycaster.ray.direction.copy(ray);
            intersections = intersections.concat(this.raycaster.intersectObject(mesh));
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
