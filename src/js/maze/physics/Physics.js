//Class for the Physics within the game that works on top of ammo.js
define(["three", "ammo", "utils"],
(THREE, Ammo, Utils) =>
{
    Ammo().then((AmmoLib) =>
    {
        Ammo = AmmoLib;
    });

    var Physics = {
        dynamicRigidBodies: [], //array of PhysicsObjects
        tempBtTransform: new Ammo.btVector3(0, 0, 0),
        physicsWorld: {},
        ammo: Ammo,

        init: () =>
        {
            var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
                dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
                overlappingPairCache = new Ammo.btDbvtBroadphase(),
                solver = new Ammo.btSequentialImpulseConstraintSolver();
            Physics.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            Physics.physicsWorld.setGravity(new Ammo.btVector3(0, -Utils.GRAVITY * 100, 0));
            Physics.tempBtTransform = new Ammo.btTransform();
        },

        update: (_delta) =>
        {
            Physics.physicsWorld.stepSimulation(_delta, 10);

            Physics.updateDynamicRigidbodies();
        },

        //dynamicRigidBody obj is of type PhysicsObject
        //updating specifically the graphics (threeObj) component from the
        //motion state of the physics rigidbody component
        updateDynamicRigidbodies: () =>
        {
            var motionState, p, q;
            Physics.dynamicRigidBodies.forEach((obj) =>
            {
                motionState = obj.rigidbody.getMotionState();
                motionState.getWorldTransform(Physics.tempBtTransform);
                p = Physics.tempBtTransform.getOrigin();
                q = Physics.tempBtTransform.getRotation();
                obj.threeObj.position.set(p.x() - obj.pos_offset.x, p.y() - obj.pos_offset.y, p.z() - obj.pos_offset.z);
                obj.threeObj.quaternion.set(q.x(), q.y(), q.z(), q.w());
            });
        },

        //returns a Ammo.btRigidBody (also adds it to the physics world)
        //threeObj:
        //physics_shape:
        //init_pos : btVector3
        //init_quat: quaternion
        //position
        createRigidbody: (threeObj, physics_shape, mass, init_pos, init_quat, pos_offset = new THREE.Vector3()) =>
        {
            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(init_pos.x + pos_offset.x, init_pos.y + pos_offset.y, init_pos.z + pos_offset.z));
            transform.setRotation(new Ammo.btQuaternion(init_quat.x, init_quat.y, init_quat.z, init_quat.w));

            var motionState = new Ammo.btDefaultMotionState(transform);
            var localInertia = new Ammo.btVector3(0, 0, 0);
            physics_shape.calculateLocalInertia(mass, localInertia);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physics_shape, localInertia);
            var rb = new Ammo.btRigidBody(rbInfo);
            try
            {
                Physics.physicsWorld.addRigidBody(rb);
            }
            catch (err)
            {
                console.log("Physics.js error probably due to using multiple Ammolibs: " + err);
            }

            //this means it is a dynamic rigidbody and we want to update its graphical component
            //with the movement/ rotation of the rigidbody in the update() loop.
            if (mass > 0) {
                rb.setActivationState(4);
                Physics.dynamicRigidBodies.push(Physics.PhysicsObject(threeObj, rb, pos_offset));
            }

            return rb;
        },

        //PhysicsObject internal class to Physics Class
        //holds graphics component, position offset to draw graphics component
        //and rigidbody ammo object
        PhysicsObject: (_threeObj, _rigidbody, _pos_offset) =>
        {
            var physics_obj =
            {
                threeObj: {},
                rigidbody: {},
                pos_offset: {},

                init: (_threeObj, _rigidbody, _pos_offset) =>
                {
                    physics_obj.threeObj = _threeObj;
                    physics_obj.rigidbody = _rigidbody;
                    physics_obj.pos_offset = _pos_offset;
                },
            }
            physics_obj.init(_threeObj, _rigidbody, _pos_offset);
            return physics_obj;
        },
    };

    return Physics;
});
