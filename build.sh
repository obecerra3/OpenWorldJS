browserify js/maze.js --outfile bundle.js
uglifyjs -c -m --verbose bundle.js > html/build.js
rm -rf bundle.js
