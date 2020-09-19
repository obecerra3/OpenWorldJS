//Class for the Physics within the game that works on top of ammo.js
define(["three", "ammo", "utils"],
(THREE, Ammo, Utils) =>
{
    // change this to happen only once
    Ammo().then((AmmoLib) =>
    {
        console.log("Ammo init");
        Ammo = AmmoLib;
    });

    var Physics =
    {
        dynamicRigidBodies : [], //array of PhysicsObjects
        tempBtTransform : {},
        physicsWorld : {},
        dispatcher : {},
        ammo : Ammo,
        terrain_height_data : null,
        TERRAIN_MARGIN : 6.0,

        init: function()
        {
            var collisionConfiguration = new this.ammo.btDefaultCollisionConfiguration();
            this.dispatcher         = new this.ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache   = new this.ammo.btDbvtBroadphase();
            var solver                 = new this.ammo.btSequentialImpulseConstraintSolver();

            this.physicsWorld = new this.ammo.btDiscreteDynamicsWorld(this.dispatcher, overlappingPairCache, solver, collisionConfiguration);
            this.physicsWorld.setGravity(new this.ammo.btVector3(0, 0, 0));

            this.tempBtTransform = new this.ammo.btTransform();
        },

        update: function(delta)
        {
            this.physicsWorld.stepSimulation(delta, 10);

            this.updateDynamicRigidbodies();
        },

        //dynamicRigidBody obj is of type PhysicsObject
        //updating specifically the graphics (threeObj) component from the
        //motion state of the physics rigidbody component
        updateDynamicRigidbodies : function()
        {
            var motionState, p, q;
            this.dynamicRigidBodies.forEach((obj) =>
            {
                motionState = obj.rigidbody.getMotionState();
                motionState.getWorldTransform(this.tempBtTransform);
                p = this.tempBtTransform.getOrigin();
                q = this.tempBtTransform.getRotation();
                obj.threeObj.position.set(p.x() - obj.pos_offset.x, p.y() - obj.pos_offset.y, p.z() - obj.pos_offset.z);
                obj.threeObj.quaternion.set(q.x(), q.y(), q.z(), q.w());
            });
        },

        //returns a this.ammo.btRigidBody (also adds it to the physics world)
        //threeObj:
        //physics_shape:
        //init_pos : btVector3
        //init_quat: quaternion
        //position
        createRigidbody: function(threeObj, physics_shape, mass, init_pos, init_quat, pos_offset = new THREE.Vector3(), add_pointer = false)
        {
            var transform = new this.ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new this.ammo.btVector3(init_pos.x + pos_offset.x, init_pos.y + pos_offset.y, init_pos.z + pos_offset.z));
            transform.setRotation(new this.ammo.btQuaternion(init_quat.x, init_quat.y, init_quat.z, init_quat.w));

            var motionState = new this.ammo.btDefaultMotionState(transform);
            var localInertia = new this.ammo.btVector3(0, 0, 0);
            physics_shape.calculateLocalInertia(mass, localInertia);

            var rbInfo = new this.ammo.btRigidBodyConstructionInfo(mass, motionState, physics_shape, localInertia);
            var rb = new this.ammo.btRigidBody(rbInfo);
            try
            {
                this.physicsWorld.addRigidBody(rb);
            }
            catch (err)
            {
                console.log("this.js ERROR probably due to using multiple this.ammolibs: " + err);
            }

            if (add_pointer)
            {
                var btVecUserData = new this.ammo.btVector3(0, 0, 0);
                btVecUserData.threeObj = threeObj;
                rb.setUserPointer(btVecUserData);
            }

            //this means it is a dynamic rigidbody and we want to update its graphical component
            //with the movement/ rotation of the rigidbody in the update() loop.
            if (mass > 0) {
                rb.setActivationState(4);
                this.dynamicRigidBodies.push(this.PhysicsObject(threeObj, rb, pos_offset));
            }

            return rb;
        },

        //PhysicsObject internal class to this Class
        //holds graphics component, position offset to draw graphics component
        //and rigidbody ammo object
        PhysicsObject: function(threeObj, rigidbody, pos_offset)
        {
            var physics_obj =
            {
                threeObj: {},
                rigidbody: {},
                pos_offset: {},

                init: (_threeObj, _rigidbody, _pos_offset) =>
                {
                    physics_obj.threeObj = threeObj;
                    physics_obj.rigidbody = rigidbody;
                    physics_obj.pos_offset = pos_offset;
                },
            }
            physics_obj.init(threeObj, rigidbody, pos_offset);
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
        createTerrainCollider: function(cd)
        {
            // create shape
            var shape = this.createTerrainShape(cd);

            // transform object according to cd.center_pos and cd.min/max height
            var transform = new this.ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new this.ammo.btVector3(
                cd.center_pos.x, cd.center_pos.y,
                    ((cd.min_height + cd.max_height) / 2) - this.TERRAIN_MARGIN));

            // create rigidbody
            var mass = 0;
            var local_inertia = new this.ammo.btVector3(0, 0, 0);
            var motion_state = new this.ammo.btDefaultMotionState(transform);
            var rb = new this.ammo.btRigidBody(
                new this.ammo.btRigidBodyConstructionInfo(
                    mass, motion_state, shape, local_inertia));

            // add userData to mark this rb as the ground
            var btVecUserData = new this.ammo.btVector3(0, 0, 0);
            btVecUserData.threeObj = { "userData" : { "name" :  "ground" } };
            rb.setUserPointer(btVecUserData);

            // add to physics world
            this.physicsWorld.addRigidBody(rb);
            return rb;
        },

        updateTerrainCollider: function(cd, collider)
        {
            // need max_height, min_height
            var shape = this.createTerrainShape(cd);
            var transform = new this.ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(
                new this.ammo.btVector3(cd.center_pos.x, cd.center_pos.y,
                    ((cd.min_height + cd.max_height) / 2) - this.TERRAIN_MARGIN));
            collider.setCollisionShape(shape);
            collider.setWorldTransform(transform);
            collider.getMotionState().setWorldTransform(transform);
        },

        // takes as input a TerrainData object passed from this.createTerrainCollider()
        createTerrainShape: function(cd)
        {
            // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
            var height_scale = 1;

            // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
            var up_axis = 2;

            // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
            var hdt = "PHY_FLOAT";

            // (inverts the triangles)
            var flip_quad_edges = false;

            // Creates height data buffer in this.ammo heap
            if (this.terrain_height_data == null)
            {
                this.terrain_height_data = this.ammo._malloc(4 * cd.width * cd.depth);
            }

            // Copy the javascript height data array to the this.ammo one.
            var p = 0;
            var p2 = 0;
            for (var j = 0; j < cd.depth; j++)
            {
                for (var i = 0; i < cd.width; i++)
                {
                    // write 32-bit float data to memory
                    this.ammo.HEAPF32[this.terrain_height_data + p2 >> 2] = cd.height_data[p];
                    // index of height_data
                    p++;
                    // 4 bytes/float
                    p2 += 4;
                }
            }

            // Creates the heightfield physics shape
            var shape = new this.ammo.btHeightfieldTerrainShape(
                cd.width,
                cd.depth,
                this.terrain_height_data,
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
            shape.setLocalScaling(new this.ammo.btVector3(scaleX, scaleY, 1));

            // set margin to avoid clipping
            shape.setMargin(this.TERRAIN_MARGIN);

            return shape;
        }
    };

    return Physics;
});
