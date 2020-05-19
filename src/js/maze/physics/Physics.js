//Class for the Physics within the game that works on top of ammo.js
define(["ammo", "utils"],
(Ammo, Utils) =>
{
    Ammo().then((AmmoLib) =>
    {
        Ammo = AmmoLib;
    });

    var Physics = {
        dynamicRigidBodies: [], //array of PhysicsObjects
        tempBtTransform: new Ammo.btVector3(0, 0, 0),
        physicsWorld: {},
        enabled: false,

        init: () =>
        {
            var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
                dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
                overlappingPairCache = new Ammo.btDbvtBroadphase(),
                solver = new Ammo.btSequentialImpulseConstraintSolver();
            Physics.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            Physics.physicsWorld.setGravity(new Ammo.btVector3(0, -Utils.GRAVITY * 100, 0));
            Physics.tempBtTransform = new Ammo.btTransform();
            Physics.enabled = true;
        },

        update: () =>
        {
            //dynamicRigidBody obj is of type PhysicsObject
            //updating specifically the graphics (threeObject) component from the
            //motion state of the physics rigidbody component
            var motionState, p, q;
            Physics.dynamicRigidBodies.forEach((obj) =>
            {
                if (obj.awake)
                {
                    motionState = obj.rigidBody.getMotionState();
                    motionState.getWorldTransform(Physics.tempBtTransform);
                    p = tempBtTransform.getOrigin();
                    q = tempBtTransform.getRotation();
                    obj.threeObject.position.set(p.x() - obj.graphics_pos_offset.x, p.y() - obj.graphics_pos_offset.y, p.z() - obj.graphics_pos_offset.z);
                    obj.threeObject.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }
            });
        },

        //returns a Ammo.btRigidBody (also adds it to the physics world)
        //threeObject:
        //physicsShape:
        //init_pos : btVector3
        //init_quat: quaternion
        //position
        createRigidBody: (threeObject, physicsShape, mass, init_pos, init_quat, graphics_pos_offset = new THREE.Vector3()) =>
        {
            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(init_pos.x + graphics_pos_offset.x, init_pos.y + graphics_pos_offset.y, init_pos.z + graphics_pos_offset.z));
            transform.setRotation(new Ammo.btinit_quaternion(init_quat.x, init_quat.y, init_quat.z, init_quat.w));

            var motionState = new Ammo.btDefaultMotionState(transform);
            var localInertia = new Ammo.btVector3(0, 0, 0);
            physicsShape.calculateLocalInertia(mass, localInertia);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
            var rigidBody = new Ammo.btRigidBody(rbInfo);

            Physics.physicsWorld.addRigidBody(rigidBody);

            //this means it is a dynamic rigidbody and we want to update its graphical component
            //with the movement/ rotation of the rigidbody in the update() loop.
            if (mass > 0) {
                rigidBody.setActivationState(4);
                Physics.dynamicRigidBodies.push(Physics.PhysicsObject(threeObject, rigidBody, graphics_pos_offset));
            }

            return rigidBody;
        },

        //PhysicsObject internal class to Physics Class
        //holds graphics component, position offset to draw graphics component
        //and rigidbody ammo object
        PhysicsObject: () =>
        {
            var physics_obj =
            {
                threeObj: {},
                rigidBody: {},
                pos_offset: {},
                awake: false,

                init: (_threeObj, _rigidBody, _pos_offset) =>
                {
                    threeObj = _threeObj;
                    rigidBody = _rigidBody;
                    pos_offset = _pos_offset;
                },
            }
            return physics_obj;
        },
    };

    return Physics;
});
