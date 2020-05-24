define(["three"], (THREE) =>
{
    var ColliderConstructor = (_rays, _ground_ray_count) =>
    {
        var Collider =
        {
            raycaster: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3, 0, 1),
            rays: [],
            mesh_map: {},
            show_rays: false,
            ground_ray_count: 0,

            init: (_rays, _ground_ray_count) =>
            {
                Collider.rays = _rays;
                Collider.ground_ray_count = _ground_ray_count;
            },

            update: (_player) =>
            {
                for (var key of Object.keys(Collider.mesh_map)) {
                    Collider.collide(_player, Collider.mesh_map[key]);
                }

                if (Collider.show_rays) {
                    var origin;
                    Collider.rays.forEach((ray) => {
                        origin = new THREE.Vector3(0, 0, 0);
                        origin.add(_player.body.position);
                        origin.add(_player.rigidbody_offset);
                        origin.add(ray.origin_offset);
                        ray.update(origin);
                    });
                }
            },

            collide: (_player, _mesh) =>
            {
                var intersections = [];

                Collider.rays.forEach((ray) => {
                    if (!ray.ground_ray) {
                        Collider.raycaster.far = ray.length;
                        Collider.raycaster.ray.origin.copy(_player.body.position);
                        Collider.raycaster.ray.origin.add(_player.centerOffset);
                        Collider.raycaster.ray.origin.add(ray.originOffset);
                        Collider.raycaster.ray.direction.copy(ray.direction);
                        intersections = intersections.concat(Collider.raycaster.intersectObject(_mesh));
                    }
                });

                if (intersections.length > 0)
                {
                    if (intersections.length == 3)
                    {
                        intersections.sort((x,y) => x.distance > y.distance);
                        intersections.slice(0,2).forEach((x) =>
                        {
                            if (x.face.normal.dot(_player.velocity) < 0)
                            {
                                _player.velocity.projectOnPlane(x.face.normal);
                            }
                        });
                    } else if (intersections.length == 5)
                    {
                        intersections.sort((x,y)=>x.distance > y.distance);
                        intersections.slice(0,3).forEach((x) =>
                        {
                            if (x.face.normal.dot(_player.velocity) < 0)
                            {
                                _player.velocity.projectOnPlane(x.face.normal);
                            }
                        });
                    } else
                    {
                        intersections.forEach((x) =>
                        {
                            if (x.face.normal.dot(_player.velocity) < 0)
                            {
                                _player.velocity.projectOnPlane(x.face.normal);
                            }
                        });
                    }
                }
            },

            isGrounded: (_player) =>
            {
                var intersections = [];
                var mesh;

                for (var key of Object.keys(Collider.mesh_map)) {
                    mesh = Collider.mesh_map[key];
                    Collider.rays.forEach((ray) =>
                    {
                        if (ray.ground_ray)
                        {
                            Collider.raycaster.far = ray.length;
                            Collider.raycaster.ray.origin.copy(_player.body.position);
                            Collider.raycaster.ray.origin.add(_player.rigidbody_offset);
                            Collider.raycaster.ray.origin.add(ray.origin_offset);
                            Collider.raycaster.ray.direction.copy(ray.direction);
                            intersections = intersections.concat(Collider.raycaster.intersectObject(mesh));
                        }
                    });
                }

                if (intersections.length > Math.ceil(Collider.ground_ray_count / 2)) {
                    return true;
                }

                return false;
            },

            toggleShowRays: (_value) =>
            {
                Collider.show_rays = _value;
                Collider.rays.forEach((ray) =>
                {
                    ray.toggleVisible(_value);
                });
            },

            addMesh: (_key, _value) =>
            {
                Collider.mesh_map[_key] = _value;
            },
        };
        Collider.init(_rays, _ground_ray_count);
        return Collider;
    };
    return ColliderConstructor;
});
