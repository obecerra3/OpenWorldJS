var TerrainEngine = require("../Terrain/TerrainEngine");

class TerrainManager {
    terrainEngine = new TerrainEngine();
    previous_pos = null;
    current_pos = null;
    terrains = [];
    RENDER_DISTANCE = 50;

    constructor(_world_state) {
        this.world_state = _world_state;
    }

    update(_player_position) {
        //decide what to draw/ enable according to player position
        if (this.previous_pos == null)
        {
            this.previous_pos = _player_position;
            this.current_pos = _player_position;
        } else
        {
            this.current_pos = _player_position;
            if (this.previous_pos.distanceTo(this.current_pos) > this.RENDER_DISTANCE)
            {
                this.terrainEngine.build(this.current_pos);
            }
        }
    }

}

module.exports = TerrainManager;
