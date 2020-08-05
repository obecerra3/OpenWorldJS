# Maze.io

_3D game engine using three.js as a graphics library and ammo.js for a physics library._

![Alt_Text](https://media.giphy.com/media/ZZqdfD1D1PsUIQooLc/giphy.gif)

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

  ### Debug Commands

  Use input in the top right corner to enter commands for debugging purposes during the game. For example
  run1 toggles faster player movement speed, run0 toggles normal player movement speed. Full uses are
  in PlayerInputHandler.js.
  
  ![Alt_Text](https://media.giphy.com/media/VGEuLtEW5fbwfPm5dw/giphy.gif)

  ### Collider.js/ Ray.js

  Raycasting and collider support to check for collisions with meshes or if a game entity is grounded.
  
  ### Physics.js

  Wrapper for Ammo library functions used for initializing Ammo, creating rigidbodies, creating and
  updated dynamic rigidbodies, and creating Terrain collider meshes from height data.

  ### Terrain.js

  Uses GLSL terrain.vert and terrain.frag as well as Terrain.js and the CDLOD algorithm created by felixpalmer.
  The height_data is generated in Terrain.js and used as a sampler2D texture for the vertex shader. The current
  idea is to use MirroredRepeatWrapping of a low frequency band of Perlin noise as the base for the terrain. From
  here we will introduce a feature agents data structure to add terrain points procedurally that will modify
  the final vertice heights (e.g. a mountain range set of points that increase the amplitude of the noise data).

  Terrain physics is handled by a moving chunk of height data centered on the player position which is updated once
  the player moves past Terrain.UPDATE_DISTANCE. The shape of the ammo height data mesh collider is updated
  instead of deleting/ creating a new collider. There is also a mesh created on the CPU side (Terrain.collider_mesh)
  which is used for raycasting to check if the player is grounded.

  ### MazeEngine.js

  Using static binary finally of a procedurally generated Maze. Still in development.

  ### Animator.js

  Wrapper handling animation blending and control for threejs.

  - Player animation FSM is still in development.
  
  ![Alt_Text](https://media.giphy.com/media/j1t1InUsCbxO01fHX3/giphy.gif)

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

