define(["three"], (THREE) =>
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
            rays = _rays;
            ground_ray_count = _ground_ray_count;
        },

        update: (_player) =>
        {
            for (var key of Object.keys(mesh_map)) {
                collide(_player, mesh_map[key]);
            }

            if (show_rays) {
                var origin;
                rays.forEach((ray) => {
                    origin = new THREE.Vector3(0, 0, 0);
                    origin.add(_player.body.position);
                    origin.add(_player.center_offset);
                    origin.add(ray.origin_offset);
                    ray.update(origin);
                });
            }
        },

        collide: (_player, _mesh) =>
        {
            var intersections = [];

            rays.forEach((ray) => {
                if (!ray.ground_ray) {
                    raycaster.far = ray.length;
                    raycaster.ray.origin.copy(_player.body.position);
                    raycaster.ray.origin.add(_player.centerOffset);
                    raycaster.ray.origin.add(ray.originOffset);
                    raycaster.ray.direction.copy(ray.direction);
                    intersections = intersections.concat(raycaster.intersectObject(_mesh));
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

            for (var key of Object.keys(mesh_map)) {
                mesh = mesh_map[key];
                rays.forEach((ray) =>
                {
                    if (ray.ground_ray)
                    {
                        raycaster.far = ray.length;
                        raycaster.ray.origin.copy(_player.body.position);
                        raycaster.ray.origin.add(_player.center_offset);
                        raycaster.ray.origin.add(ray.origin_offset);
                        raycaster.ray.direction.copy(ray.direction);
                        intersections = intersections.concat(raycaster.intersectObject(mesh));
                    }
                });
            }

            if (intersections.length > Math.ceil(ground_ray_count / 2)) {
                return true;
            }

            return false;
        },

        toggleShowRays: (_value) =>
        {
            show_rays = _value;
            rays.forEach((ray) =>
            {
                ray.toggleVisible(_value);
            });
        },

        addMesh: (_key, _value) =>
        {
            mesh_map[_key] = _value;
        },

    }
    return Collider;
});
