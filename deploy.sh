mkdir -p deploy
cp -R src/ deploy/src/
rm -rf deploy/src/build.js
scp -r deploy/src/ bnwlkr@themaze.io:/var/www/
cp -R js/ deploy/src/js/
sed -i -e 's#ws://localhost:8000#wss://themaze\.io:8000#g' deploy/src/js/maze.js
browserify deploy/src/js/maze.js --outfile deploy/src/bundle.js
uglifyjs -c -m --ecma 6 deploy/src/bundle.js -o deploy/src/build.js
scp deploy/src/build.js bnwlkr@themaze.io:/var/www/html/
rm -rf deploy/src/bundle.js deploy/src/build.js deploy/src/js deploy/src/html
