//start the game, detector will detect if the client's computer supports webgl
'use strict'
require(['detector', 'game', 'container'], (Detector, game, container) =>
{
    if (!Detector.webgl)
    {
        console.log("ERROR: WebGl is not supported");
        Detector.addGetWebGLMessage();
        container.innerHTML = "";
    }

    game.init();
    game.update();
});
