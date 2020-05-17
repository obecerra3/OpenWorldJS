# Maze.io

_An internet maze_

## Setup

- Install required **npm objects** after **git-clone** navigate to the project directory in the sheel and run the command `npm i`:

- Build Locally:

  - Navigate to the directory named _Maze_ in shell

  - Enter the command `./local.sh`

  - Game will be hosted locally, access with web browser

    - **Address:** <http://localhost:8000/maze.php>

## Basic structure

- ### WorldState

  Global object holding a lot of info about the current game state.

- ### Resource Manager

  The managers are initialized by Resource Manager and are supposed to decide when to spawn/ de-spawn/ to what level of detail to draw different things according to the player position (a level of detail implementation using chunks).

- ### Terrain

  Skeleton code for how I plan to implement the terrain. For different graphics aspects, we can just put them in their separate folder.

- ### Enable Debugger

  In 'maze.js', uncomment the line `worldState.debugDrawer.enable();` in `initDebu()` on line 102 to view containers for the physics containers in the scene for debugging.

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

  The main game loop is in maze.js in the `animate()` function. Most classes have an update loop that gets called either from there or from another class that feeds them the info

- ### Constants

  Utils has a bunch of constants, so when you need a new constant you can define it there and access it any where using `Utils.SOME_CONSTANT`

- ### Event Queue

  The event queue in **'maze.js'** is for adding an event (some code you want to be run in the action component and not letting it run until the verify function you include returns true)

- ### Action Function

  - The Action Function is for initializing stuff that relies on something else to be initialized

  - You can add arguments to the action function in an arguments array

## Next Steps

- ### Action Function

  - This is an example of something that should be its own class in Utils

  - This is a poor solution to coupling with how we do the current player stuff (not sure what this means)

- ### Single Responsibility

  - **'maze.js'** should be cleaned so that it is easier to read and and doesn't do a thousand things in the same file

  - Do the same thing for the player class since it currently handles way more than it should

- ### Animations

  Animations are also still buggy since my finite state machine is not implemented yet so I have to fix that.

- ### Observer Pattern

  How a lot of these classes will communicate.

## Notes

- On MacOS `cmd-option-j` opens the **javascript console** on Google Chrome (Windows shortcut unknown)

- Most of the time questions you have when developing should have 'threejs' alongside them to get the best results from Google.
