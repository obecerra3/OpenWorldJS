//start the maze, detector will detect if the client's computer supports webgl
require(['detector', 'maze', 'container'], (Detector, maze, container) =>
{
    if (!Detector.webgl)
    {
        console.log("ERROR: WebGl is not supported");
        Detector.addGetWebGLMessage();
        container.innerHTML = "";
    }
    
    maze.init();
    maze.update();
});
