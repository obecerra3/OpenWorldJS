
import {
  BoxGeometry,
} from "./three.module.js";

var BuildWalls = function (chunkPosition, chunkArray) {

  var walls = [[], []];
  var COL_LEN = 27;
  var ROW_LEN = 27;
  var WALL_SIZE = 20;
  var SPACE_SIZE = 90;

  for (var i = 0; i < chunkArray.length; i++) {
      if (chunkArray[i] == 1) {
          var tempWalls = createWalls(i);
          walls[0].push(tempWalls[0]);
          walls[1].push(tempWalls[1]);
      }
  }

  function createWalls(i) {

      var xScale = WALL_SIZE;
      var zScale = WALL_SIZE;
      var DEFAULT_X = chunkPosition[0] + (Math.floor(i / COL_LEN) % COL_LEN) * SPACE_SIZE;
      var DEFAULT_Z = chunkPosition[1] + (i % COL_LEN) * SPACE_SIZE;
      var xPosition = DEFAULT_X;
      var zPosition = DEFAULT_Z;
      var wallColor = 0x005b96;
      var walls = [[], []];

      var checkRight = (i + 1 < chunkArray.length && chunkArray[i + 1] == 1 && Math.floor((i + 1)/ ROW_LEN) == Math.floor(i / ROW_LEN));
      var checkLeft = (i - 1 >= 0 && chunkArray[i - 1] == 1 && Math.floor((i - 1)/ ROW_LEN) == Math.floor(i / ROW_LEN));
      var checkUp = (i + ROW_LEN < chunkArray.length && chunkArray[i + ROW_LEN] == 1);
      var checkDown = (i - ROW_LEN >= 0 && chunkArray[i - ROW_LEN] == 1);

      //set zScale and zPosition for wall1

      if ( checkRight && checkLeft) {
          zScale = SPACE_SIZE;
      } else if ( checkRight ) {
          zScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
          zPosition -= (zScale / 2) - (SPACE_SIZE / 2);
      } else if ( checkLeft ) {
          zScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
          zPosition += (zScale / 2) - (SPACE_SIZE / 2);
      }

      //set xScale and xPosition for wall2

      if ( checkUp && checkDown ) {
          xScale = SPACE_SIZE;
      } else if ( checkUp ) {
          xScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
          xPosition -= (xScale / 2) - (SPACE_SIZE / 2);
      } else if ( checkDown ) {
          xScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
          xPosition += (xScale / 2) - (SPACE_SIZE / 2);
      }

      var WALL_HEIGHT = 10;

      if ( ( checkRight || checkLeft ) && ( checkUp || checkDown ) ) {

          walls[0].push(new BoxGeometry(WALL_SIZE, WALL_HEIGHT, zScale));
          walls[1].push([DEFAULT_X, 0, zPosition])

          walls[0].push(new BoxGeometry(xScale, WALL_HEIGHT, WALL_SIZE));
          walls[1].push([xPosition, 0, DEFAULT_Z]);


      } else {

          walls[0].push(new BoxGeometry(xScale, WALL_HEIGHT, zScale));
          walls[1].push([xPosition, 0, zPosition]);

      }

      return walls;

  }

  return walls;

}



export { BuildWalls };
