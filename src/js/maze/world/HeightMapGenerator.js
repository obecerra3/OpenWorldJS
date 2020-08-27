// Node file for generating the height map data file
const fs = require('fs');
const ImprovedNoise = require('../../lib/ImprovedNoise.js');

// data
var width = Math.pow(2, 14);
var width2 = width / 2;
var quality = 1;
var frequency = 0.1;
var iterations = 4;
var negative_bound = Math.pow(2, 32);
var rand_z = 42;
var x = 0, y = 0, height = 0;
var perlin = new ImprovedNoise();

// stats
var max = Number.NEGATIVE_INFINITY;
var min = Number.POSITIVE_INFINITY;
var hrstart = process.hrtime();

var calcRow = (yi) =>
{
    var data = new Uint8Array(width);
    for (var xi = -width2; xi < width2; xi++)
    {
        quality = 1;
        for (var j = 0; j < iterations; j++)
        {
            x = xi + negative_bound;
            y = yi + negative_bound;
            height = Math.abs(perlin.noise((x / quality) * frequency, (y / quality) * frequency, rand_z * frequency) * quality);
            var i = xi + width2;
            data[i] += height;

            // stats
            if (j == iterations - 1)
            {
                //last iteration so time to check the heights for the stats
                if (data[i] > max) max = data[i];

                if (data[i] < min) min = data[i];
            }
            quality *= 5;
        }
    }
    fs.appendFile("./src/js/data/HeightData", Buffer.from(data), (error) =>
    {
        if (error)
        {
            console.log("File Error: " + error);
        }
        else if (yi < width2)
        {
            calcRow(++yi);
        }
        else
        {
            finished(max, min);
        }
    });
};

var finished = (max, min) =>
{
    // stats
    console.log("max: " + max);
    console.log("min: " + min);

    var hrend = process.hrtime(hrstart);
    console.info('Heightmap generation time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
}

var y_start = -width2;
calcRow(y_start);

// for (var yi = -width2; yi < width2; yi++)
// {
//     // var data = new Uint8Array(width);
//     for (var xi = -width2; xi < width2; xi++)
//     {
//         quality = 1;
//         for (var j = 0; j < iterations; j++)
//         {
//             x = xi + negative_bound;
//             y = yi + negative_bound;
//             height = Math.abs(perlin.noise((x / quality) * frequency, (y / quality) * frequency, rand_z * frequency) * quality);
//             var i = xi + width2;
//             var ij = yi + width2;
//             data[i + ij * width] += height;
//
//             // stats
//             if (j == iterations - 1)
//             {
//                 //last iteration so time to check the heights for the stats
//                 if (data[xi + yi * width] > max) max = data[xi + yi * width];
//
//                 if (data[xi + yi * width] < min) min = data[xi + yi * width];
//             }
//             quality *= 5;
//         }
//     }
// }
//
// // save to file
// fs.appendFile("./src/js/data/HeightData", Buffer.from(data), (error) =>
// {
//     if (error)
//     {
//         console.log("File Error: " + error);
//     }
// });
