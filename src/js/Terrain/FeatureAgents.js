//different functions will carve different features into a heightmap. River agent, cave agent, coast agent, plain agent, plateau agent, canyon agent, mountain agent
class FeatureAgents
{
    constructor()
    {
        this.heightmap = null;
    }

    //will call the different agents to edit the heightmap
    simulate(heightmap)
    {
        this.heightmap = heightmap;
    }

    riverAgent()
    {

    }

    coastAgent()
    {

    }
    mountainAgent()
    {

    }

    plainAgent()
    {

    }

    pathAgent()
    {

    }

    canyonAgent()
    {

    }

}

module.exports = FeatureAgents;
