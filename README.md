# Maze.io

_3D game engine using three.js as a graphics library and ammo.js for a physics library. Currently uses the same structure as https://github.com/felixpalmer/amd-three.js/ in order to organize requiring shaders or javascript components._

## Setup

- To install required **npm objects** after the **git-clone** navigate to the project directory in the sheel and run the command `npm i`:

- Build Locally:

  - Navigate to the directory named _Maze_ in shell

  - Enter the command `./local.sh`

  - Game will be hosted locally, access with web browser

    - **Address:** <http://localhost:8000/maze.php>

## Basic structure

- ### Libraries

  The libraries we are using are in the **lib** directory

  - **draco** is for faster glb/gltf model loading

  - **three-instanced-mesh** is to do instancing of 3d meshes to render them faster (draw a bunch of models in one draw command)

  - **'ammo.js'** is the physics engine

  - **'AmmoDebugDrawer.js'** is how we debug the physics

  - **'GLTFLoader.js'** is for loading 3d models that are in the form of gltf/glb files which are I think the fastest way to store/load them in 3js

  - **'stats.min.js'** is for the stats that appear in the top left of the screen when the game is running

  - **'three.min.js'** is the graphics library.

## 'maze.js'

Currently everything is initialized in the **'maze.js'** file located in **_src/js/maze.js_**

- ### Main Game Loop

  The main game loop is in maze.js in the `update()` function. Most classes have an update loop that gets called either from there or from another class that feeds them the info.

- ### Constants

  Utils has a bunch of constants, so when you need a new constant you can define it there and access it any where using `Utils.SOME_CONSTANT`

- ### Event Queue

  The event queue in **'maze.js'** is for adding an event (some code you want to be run in the action component and not letting it run until the verify function you include returns true)

- ### Action Function

  - The Action Function is for initializing stuff that relies on something else to be initialized

  - You can add arguments to the action function in an arguments array

## Next Steps

- ### Animations

  Animations are also still buggy since the Player finite state machine is not tested fully.
  
- ### Terrain
  
  Finish implementing first a simple terrain on a single Plane Mesh. This will use height values calculated from a noise function. This noise function will later be dependent on the biome the current terrain belongs to. The heightmap generated will also undergo a processing stage using feature agents to carve terrain features (such as lakes, rivers, valleys, mountains, plains, etc...). From here the heightmap data can be used by a vertex shader to place vertices according to heights. A fragment shader will get texture information from the current biome of the chunk and the gradient of the terrain to place the correct texture. 

- ### Observer Pattern

  How a lot of these classes will communicate.

## Notes

- On MacOS `cmd-option-j` opens the **javascript console** on Google Chrome

- You can enable debug drawing of the ammo physics colliders by toggling **show_ammo_drawer** in **src/js/maze/utils/Debug.js**
