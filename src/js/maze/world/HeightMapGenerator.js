// Node file for generating the height map data file
const fs = require('fs');
const ImprovedNoise = require('../../lib/ImprovedNoise.js');

// data
var world_width = Math.pow(2, 28);
var chunk_width = Math.pow(2, 14);
var chunk_width2 = Math.pow(2, 13);
var quality = 1;
var frequency = 0.1;
var iterations = 4;
var negative_bound = Math.pow(2, 32);
var rand_z = 42;
var x = 0, y = 0, height = 0;
var perlin = new ImprovedNoise();

// stats
var hrstart = process.hrtime();

var buildChunk = (chunk_name, x_bound, y_bound) =>
{
    var max = Number.NEGATIVE_INFINITY;
    var min = Number.POSITIVE_INFINITY;
    var data = new Uint8Array(chunk_width * chunk_width);
    for (var yi = y_bound[0]; yi < y_bound[1]; yi++)
    {
        // var data = new Uint8Array(width);
        for (var xi = x_bound[0]; xi < x_bound[1]; xi++)
        {
            quality = 1;
            for (var j = 0; j < iterations; j++)
            {
                x = xi + negative_bound;
                y = yi + negative_bound;
                height = Math.abs(perlin.noise((x / quality) * frequency, (y / quality) * frequency, rand_z * frequency) * quality);
                var i = xi + chunk_width2;
                var ij = yi + chunk_width2;
                data[i + ij * chunk_width] += height;

                // stats
                if (j == iterations - 1)
                {
                    //last iteration so time to check the heights for the stats
                    if (data[i + ij * chunk_width] > max) max = data[i + ij * chunk_width];

                    if (data[i + ij * chunk_width] < min) min = data[i + ij * chunk_width];
                }
                quality *= 5;
            }
        }
    }

    // save to file
    fs.writeFile("./src/js/data/" + chunk_name, Buffer.from(data), (error) =>
    {
        console.log(chunk_name + "stats: ");
        console.log("max: " + max);
        console.log("min: " + min);

        if (error)
        {
            console.log("File Error: " + error);
        }
    });
}

buildChunk("top_left", [-chunk_width, 0], [0, chunk_width]);
buildChunk("top_right", [0, chunk_width], [0, chunk_width]);
buildChunk("bottom_left", [-chunk_width, 0], [-chunk_width, 0]);
buildChunk("bottom_right", [0, chunk_width], [-chunk_width, 0]);

var hrend = process.hrtime(hrstart);
console.info('Heightmap generation time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
