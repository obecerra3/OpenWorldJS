//create the terrain
var Terrain = require("./Terrain.js");
var HeightMapGenerator = require("./HeightMapGenerator.js");
var FeatureAgents = require("./FeatureAgents.js");
var seedrandom = require("seedrandom");


class TerrainEngine
{
    constructor()
    {
        this.heightMapGenerator = new HeightMapGenerator();
        this.FeatureAgents = new FeatureAgents();
        this.rng = seedrandom(42);


    }

    build(player_position)
    {

    }

}

module.exports = TerrainEngine;
