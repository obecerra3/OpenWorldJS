define(["three"], (THREE) =>
{
    var Time =
    {
        DAY_LENGTH : 600,
        NIGHT_LENGTH : 0,

        clock: new THREE.Clock(),
        day_start_time : 0,
        elapsed_day_time : 0,

        update : () =>
        {
            Time.elapsed_day_time = Time.clock.elapsedTime - Time.day_start_time;

            if (Time.elapsed_day_time >= Time.DAY_LENGTH + Time.NIGHT_LENGTH)
            {
                Time.day_start_time = Time.clock.elapsedTime;
            }
        },
    };

    return Time;
});
