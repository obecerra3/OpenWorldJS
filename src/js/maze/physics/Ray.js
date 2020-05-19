define(["three"], (THREE) =>
{
    var RayConstructor = (_scene, _direction, _length = 1, _ground_ray = false, _origin_offset = new THREE.Vector3(), _color = 0x0000ff) =>
    {
        var Ray =
        {
            visible: false,
            direction: {},
            origin_offset: {},
            length: 0,
            debug_ray: {},
            ground_ray: false,
            color: 0,

            init: (_scene, _direction, _length = 1, _ground_ray = false, _origin_offset = new THREE.Vector3(), _color = 0x0000ff) =>
            {
                Ray.direction = _direction.normalize();
                Ray.ground_ray = _ground_ray;
                Ray.length = _length;
                Ray.origin_offset = _origin_offset;
                Ray.color = _color;

                Ray.debug_ray = new THREE.ArrowHelper(Ray.direction, new THREE.Vector3(), Ray.length, Ray.color);
                _scene.add(Ray.debug_ray);
            },

            update: (_origin) =>
            {
                if (Ray.visible)
                {
                    Ray.debug_ray.position.copy(_origin);
                }
            },

            toggleVisible: (_value) =>
            {
                Ray.visible = _value;
                Ray.debug_ray.visible = _value;
            }
        };
        Ray.init(_scene, _direction, _length, _ground_ray, _origin_offset, _color);
        return Ray;
    }
    return RayConstructor;
});
