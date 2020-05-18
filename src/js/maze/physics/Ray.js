define(["three", "scene"], (THREE, scene) =>
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

        init: (_direction, _length = 1, _ground_ray = false, _origin_offset = new THREE.Vector3(), _color = 0x0000ff) =>
        {
            direction = _direction.normalize();
            ground_ray = _ground_ray;
            length = _length;
            origin_offset = _origin_offset;
            color = _color;

            debug_ray = new THREE.ArrowHelper(direction, new THREE.Vector3(), length, color);
            scene.add(debug_ray);
        },

        update: (_origin) =>
        {
            if (visible)
            {
                debug_ray.position.copy(_origin);
            }
        },

        toggleVisible: (_value) =>
        {
            visible = _value;
            debug_ray.visible = _value;
        }
    };
    return Ray;
});
