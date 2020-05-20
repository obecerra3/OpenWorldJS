define([], () =>
{
    var MessageBuilder =
    {
        encoder: {},

        init: () =>
        {
            MessageBuilder.encoder = new TextEncoder();
        },

        hello: (_username) =>
        {
            return MessageBuilder.encoder.encode(_username);
        },

        state: (_player) =>
        {
            var buffer = new ArrayBuffer(22);
            var dataView = new DataView(buffer);
            dataView.setInt8(0, 0);
            dataView.setInt8(1, _player.crouching);
            dataView.setFloat32(2, _player.body.position.x);
            dataView.setFloat32(6, _player.body.position.z);
            dataView.setFloat32(10, _player.lookDirection.x);
            dataView.setFloat32(14, _player.lookDirection.y)
            dataView.setFloat32(18, _player.lookDirection.z);
            return buffer;
        },

        jump: () =>
        {
            var buffer = new ArrayBuffer(1);
            var dataView = new DataView(buffer);
            dataView.setInt8(0, 3);
            return buffer;
        },

    };
    return MessageBuilder;
});
