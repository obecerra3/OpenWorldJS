//Class for the Physics within the game that works on top of ammo.js
define(["three", "ammo", "utils"],
(THREE, Ammo, Utils) =>
{
    // change this to happen only once ever
    Ammo().then((AmmoLib) =>
    {
        Ammo = AmmoLib;
    });

    var Physics =
    {
        dynamicRigidBodies: [], //array of PhysicsObjects
        tempBtTransform: {},
        physicsWorld: {},
        ammo: Ammo,

        init: () =>
        {
            var collisionConfiguration = new Physics.ammo.btDefaultCollisionConfiguration();
            var dispatcher             = new Physics.ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache   = new Physics.ammo.btDbvtBroadphase();
            var solver                 = new Physics.ammo.btSequentialImpulseConstraintSolver();

            Physics.physicsWorld = new Physics.ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            Physics.physicsWorld.setGravity(new Physics.ammo.btVector3(0, 0, -Utils.GRAVITY * 100));
            // Physics.physicsWorld.setGravity(new Physics.ammo.btVector3(0, 0, -Utils.GRAVITY));
            // Physics.physicsWorld.setGravity(new Physics.ammo.btVector3(0, 0, 0));
            Physics.tempBtTransform = new Physics.ammo.btTransform();
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

        //returns a Physics.ammo.btRigidBody (also adds it to the physics world)
        //threeObj:
        //physics_shape:
        //init_pos : btVector3
        //init_quat: quaternion
        //position
        createRigidbody: (threeObj, physics_shape, mass, init_pos, init_quat, pos_offset = new THREE.Vector3()) =>
        {
            var transform = new Physics.ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Physics.ammo.btVector3(init_pos.x + pos_offset.x, init_pos.y + pos_offset.y, init_pos.z + pos_offset.z));
            transform.setRotation(new Physics.ammo.btQuaternion(init_quat.x, init_quat.y, init_quat.z, init_quat.w));

            var motionState = new Physics.ammo.btDefaultMotionState(transform);
            var localInertia = new Physics.ammo.btVector3(0, 0, 0);
            physics_shape.calculateLocalInertia(mass, localInertia);

            var rbInfo = new Physics.ammo.btRigidBodyConstructionInfo(mass, motionState, physics_shape, localInertia);
            var rb = new Physics.ammo.btRigidBody(rbInfo);
            try
            {
                Physics.physicsWorld.addRigidBody(rb);
            }
            catch (err)
            {
                console.log("Physics.js error probably due to using multiple Physics.ammolibs: " + err);
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

        // takes as input a ChunkData object passed from Terrain.js
        // ChunkData includes fields:
        // width,
        // depth,
        // min_height,
        // max_height,
        // width_extents,
        // height_extents,
        // height_data,
        // center_pos,
        createTerrainCollider: (cd) =>
        {
            // need max_height, min_height
            var shape = Physics.createTerrainShape(cd);
            var transform = new Physics.ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Physics.ammo.btVector3(
                cd.center_pos.x, cd.center_pos.y,
                    (cd.min_height + cd.max_height) / 2));
            var mass = 0;
            var local_inertia = new Physics.ammo.btVector3(0, 0, 0);
            var motion_state = new Physics.ammo.btDefaultMotionState(transform);
            var rb = new Physics.ammo.btRigidBody(
                new Physics.ammo.btRigidBodyConstructionInfo(
                    mass, motion_state, shape, local_inertia));
            Physics.physicsWorld.addRigidBody(rb);
            return rb;
        },

        updateTerrainCollider: (cd, collider) =>
        {
            // need max_height, min_height
            var shape = Physics.createTerrainShape(cd);
            var transform = new Physics.ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(
                new Physics.ammo.btVector3(cd.center_pos.x, cd.center_pos.y,
                    (cd.min_height + cd.max_height) / 2));
            collider.setCollisionShape(shape);
            collider.setWorldTransform(transform);
            collider.getMotionState().setWorldTransform(transform);
        },

        // takes as input a TerrainData object passed from Physics.createTerrainCollider()
        createTerrainShape: (cd) =>
        {
            // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
            var height_scale = 1;

            // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
            var up_axis = 2;

            // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
            var hdt = "PHY_FLOAT";

            // (inverts the triangles)
            var flip_quad_edges = false;

            // Creates height data buffer in Physics.ammo heap
            var ammo_height_data = Physics.ammo._malloc(4 * cd.width * cd.depth);

            // Copy the javascript height data array to the Physics.ammo one.
            var p = 0;
            var p2 = 0;
            for (var j = 0; j < cd.depth; j++)
            {
                for (var i = 0; i < cd.width; i++)
                {
                    // write 32-bit float data to memory
                    Physics.ammo.HEAPF32[ammo_height_data + p2 >> 2] = cd.height_data[p];
                    // index of height_data
                    p++;
                    // 4 bytes/float
                    p2 += 4;
                }
            }

            // Creates the heightfield physics shape
            var shape = new Physics.ammo.btHeightfieldTerrainShape(
                cd.width,
                cd.depth,
                ammo_height_data,
                height_scale,
                cd.min_height,
                cd.max_height,
                up_axis,
                hdt,
                flip_quad_edges
            );

            // Set horizontal scale
            var scaleX = cd.width_extents / (cd.width - 1);
            var scaleY = cd.depth_extents / (cd.depth - 1);
            shape.setLocalScaling(new Physics.ammo.btVector3(scaleX, scaleY, 1));

            // May need to change this ?????
            shape.setMargin(2.0);

            return shape;
        }
    };

    return Physics;
});
