// Node file for generating the height map data file
const fs = require('fs');
const ImprovedNoise = require('../../lib/ImprovedNoise.js');

// data
var chunk_width = Math.pow(2, 14);
var chunk_width2 = Math.pow(2, 13);
var quality = 1;
var frequency = 0.25;
var perlin_iterations = 4;
var smoothing_iterations = 5;
var negative_bound = Math.pow(2, 14);
var rand_z = 42;
var x = 0, y = 0, height = 0, i = 0, j = 0;
var perlin = new ImprovedNoise();

// stats
var hrstart = process.hrtime();

try
{
    fs.unlinkSync("./src/js/data/HeightData");
}
catch(err)
{
    console.error(err)
}

var buildChunk = (chunk_name, x_bound, y_bound) =>
{
    // generate data
    var data = new Uint8Array(chunk_width * chunk_width);

    for (var yi = y_bound[0] + chunk_width2 - 1; yi < y_bound[1] + chunk_width2 - 1; yi++)
    {
        for (var xi = x_bound[0] + chunk_width2 - 1; xi < x_bound[1] + chunk_width2 - 1; xi++)
        {
            quality = 1;
            x = xi + negative_bound;
            y = yi + negative_bound;
            for (var k = 0; k < perlin_iterations; k++)
            {
                height = Math.abs(perlin.noise((x / quality) * frequency, (y / quality) * frequency, (rand_z / quality) * frequency) * quality);
                data[xi + yi * chunk_width] += height;
                quality *= 5;
            }
        }
    }

    // save to file
    fs.appendFile("./src/js/data/HeightData", Buffer.from(data), (error) =>
    {
        if (error)
        {
            console.log("File Error: " + error);
        }
    });
}

buildChunk("top_left", [-chunk_width, 0], [0, chunk_width]);
buildChunk("top_right", [0, chunk_width], [0, chunk_width]);
buildChunk("bot_left", [-chunk_width, 0], [-chunk_width, 0]);
buildChunk("bot_right", [0, chunk_width], [-chunk_width, 0]);

var hrend = process.hrtime(hrstart);
console.info('Heightmap generation time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
