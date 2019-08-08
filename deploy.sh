mkdir -p deploy
cp -R js/ deploy/js/
sed -i -e 's#ws://localhost:8000#wss://themaze\.io:8000#g' deploy/js/maze.js
browserify deploy/js/maze.js --outfile deploy/bundle.js
uglifyjs -c -m --ecma 6 deploy/bundle.js -o deploy/build.js
scp deploy/build.js bnwlkr@themaze.io:/var/www/html/
rm -rf deploy/bundle.js deploy/build.js deploy/js
