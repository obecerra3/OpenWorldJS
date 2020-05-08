# Maze
An internet maze

#to install npm modules the first time you git clone:
npm i

#to build locally:
./local.sh
and then go to http://localhost:8000/maze.php in your browser

#basic structure
Currently everything is initialized in maze.js which is a bit of a mess. Worldstate is like a global object holding a 
lot of info. about the current game state. The managers are initialised by Resource Manager and are supposed to decide 
when to spawn/ despawn/ to what level of detail to draw different things according to the player position (a level of 
detail implementation using chunks). For the different graphics aspects we will implement we can just put them in their 
seperate folder, like the Terrain folder with skeleton code for how I plan to implement the terrain. In maze.js in 
initDebu() on line 102 you can uncomment the line // worldState.debugDrawer.enable(); in order to see the lines/ 
containers for the physics containers in the scene for debugging. Also the libraries we are using are in lib, draco 
is for faster glb/gltf model loading, three-instanced-mesh is to do instancing of 3d meshes to render them faster 
(draw a bunch of models in one draw command), ammo.js is the physics engine, ammo debug drawer is how we debug the
physics, gltf loader is for loading 3d models that are in the form of gltf/glb files which are I think the fastest way
to store/load them in 3js, stats.min.js is for the stats that appear in the top left, three.min.js is the graphics
library. Most of the time questions you have when developing should have threejs allongside them to get the best 
results from google lol. 

The overall architecture needs a lot of work since I didnt know a lot of the game programming patterns stuff when 
Ben and I first set this up. Some changes I'm definitely going to add soon is cleaning up maze.js so that it is 
easier to read and and doesn't do a thousand things in the same file (single responsibility) and do the same thing
for the player class since it currently handles way more than it should. Animations are also still buggy since my 
finite state machine is not implemented yet so I have to fix that. Also we should likely be using the Observer pattern
for how a lot of these classes will communicate. Also the main game loop is in maze.js in the animate() function. 
Most classes have an update loop that gets called either from there or from another class that feeds them the info. 
they need to update. Utils has a bunch of constants, so when you need a new constant you can define it there and 
access it any where using Utils.SOME_CONSTANT. The event queue in maze.js is for adding an event/ some code you want 
to be run in the action component and not letting it run until the verify function you include returns true, you can 
also add arguments to the action function in an arguments array. This is an example of something that should be its 
own class in Utils that we should move out of there. It is for initializing stuff that relies on something else to
be initialized. Also this is a shitty solution to coupling that exists with how we do the current player stuff so 
we should try to fix that coupling as well. 

#ps cmd-option-j on a mac is for opening up the javascript console and is super useful, maybe learn what it is for windows


