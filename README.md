# Maze.io

_3D open world game engine using three.js._

![Alt_Text](https://media.giphy.com/media/PwcFUVi3EyyPyxaUEd/giphy.gif)

## Setup

- To install required **npm objects** after the **git-clone** navigate to the project directory in the shell and run the command `npm i`:

- Build Locally:

  - Navigate to the directory named _Maze_ in shell

  - Enter the command `./local.sh`

  - Game will be hosted locally, access with web browser

    - **Address:** <http://localhost:8000/maze.php>

## Basic structure

## 'maze.js'

Currently everything is initialized in the **'maze.js'** file located in **_src/js/maze.js_**

## Features

  ### Controls

  - WASD/ Arrow Keys to move
  - C to crouch
  - Shift to run
  - Space to Jump

  - 0 to Enter/Exit Orbit Controls
    - WASD to move camera
    - 9 to increase orbit speed
    - 1 to decrease orbit speed

  - g to toggle Zero Gravity, Low Gravity, Normal Gravity

  - x to toggle first person or third person controls

  ### Debug Commands

  Use input in the top right corner to enter commands for debugging purposes during the game. For example
  run1 toggles faster player movement speed, run0 toggles normal player movement speed. Full uses are
  in PlayerInputHandler.js.

  ### Collider.js/ Ray.js

  Raycasting and collider support to check for collisions with meshes or if a game entity is grounded.

  ### Physics.js

  Wrapper for Ammo library functions used for initializing Ammo, creating rigidbodies, creating and
  updated dynamic rigidbodies, and creating Terrain collider meshes from height data.

  ### Terrain.js

  Currently using 2D Gradient Noise and Fractional Brownian Motion in Noise.glsl. This creates a realistic terrain
  with several sharp edges/ details. This is pre-calculated per chunk using GPGPU GLSL Fragment Shaders through the
  threejs library GPUCompute in Terrain.js. Also using a box blur algorithm to create a smoothed version of the terrain.
  Textures are created procedurally using noise in TextureGen.frag. A gradient noise LUT is also precomputed in TextureGen.frag
  to be used instead of a slower hash function. 

  Terrain physics is handled by a moving chunk of height data centered on the player position which is updated once
  the player moves past Terrain.UPDATE_DISTANCE. The shape of the ammo height data mesh collider is updated
  instead of deleting/ creating a new collider. Using GPGPU in order to check if the player is grounded by comparing
  the player position to the current height of the terrain.

  ### MazeEngine.js

  Using static binary finally of a procedurally generated Maze. Still in development.

  ### Animator.js

  Wrapper handling animation blending and control for threejs.

  - Player animation FSM states are in Utils/States.js
  - Includes support for Idle, Idle Left/Right Turning
  - Foward/Backward Walking, Left/Right Walk Strafing
  - Forward/Backward Running, Left/Right Run Strafing
  - Jump Animation/ Fall Idle animation/ Land Animation
  - Crouch Idle, Forward/Backward Crouch Walking

  ### Debug.js

  Holds several debugging components such as the Ammo Debug Drawer for drawing collider shapes
  in ammo using threejs as well as stats.js.

  ### Modified PointerLockControls.js

  The default up vector for three objects in this scene is (0, 0, 1). PointerLockControls has been modified
  to work with these constraints.

  ### Multiplayer.js

  - Multiplayer support in development.


## Libraries

The libraries we are using are in the **lib** directory

- **draco** is for faster glb/gltf model loading

- **three-instanced-mesh** is to do instancing of 3d meshes to render them faster (draw a bunch of models in one draw command)

- **'ammo.js'** is the physics engine

- **'AmmoDebugDrawer.js'** is how we debug the physics

- **'GLTFLoader.js'** is for loading 3d models that are in the form of gltf/glb files which are I think the fastest way to store/load them in 3js

- **'stats.min.js'** is for the stats that appear in the top left of the screen when the game is running

- **'three.min.js'** is the graphics library.

## Acknowledgements

- https://threejs.org/ and https://threejs.org/examples/

- Currently uses the same structure as https://github.com/felixpalmer/amd-three.js/ in order to organize requiring shaders or javascript components.

- Terrain CDLOD from https://github.com/felixpalmer/lod-terrain

- mixamo.com for animations and 3D Player models.
