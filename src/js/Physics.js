
class Physics {
    constructor (worldState) {
        this.worldState = worldState;
        this.dynamicRigidBodies = [];
        this.player = {}
    }

    update (delta) {
        this.dynamicRigidBodies.forEach((obj) => {
            let motionState = obj.rigidBody.getMotionState();
            motionState.getWorldTransform(this.worldState.tempBtTransform);
            let p = this.worldState.tempBtTransform.getOrigin();
            let q = this.worldState.tempBtTransform.getRotation();
            obj.threeObject.position.set(p.x() - obj.positionOffset.x, p.y() - obj.positionOffset.y, p.z() - obj.positionOffset.z);
            obj.threeObject.quaternion.set(q.x(), q.y(), q.z(), q.w());
        });
    }

    createRigidBody (threeObject, physicsShape, mass, pos, quat, positionOffset = new THREE.Vector3()) {
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x + positionOffset.x, pos.y + positionOffset.y, pos.z + positionOffset.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        var motionState = new Ammo.btDefaultMotionState(transform);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        physicsShape.calculateLocalInertia(mass, localInertia);

        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
        var rigidBody = new Ammo.btRigidBody(rbInfo);

        this.worldState.physicsWorld.addRigidBody(rigidBody);

        if (mass > 0) {
            rigidBody.setActivationState(4);
            this.dynamicRigidBodies.push(new PhysicsObject(threeObject, rigidBody, positionOffset));
        }

        return rigidBody;
    }
}

class PhysicsObject {
    constructor (threeObject, rigidBody, positionOffset) {
        this.threeObject = threeObject;
        this.rigidBody = rigidBody;
        this.positionOffset = positionOffset;
    }
}

module.exports = Physics;
