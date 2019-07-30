mkdir deploy
cp -R html/ deploy/html
sed -i -e 's#ws://localhost:8000#wss://themaze\.io:8000#g' deploy/html/js/maze.js
scp -r deploy/html/ bnwlkr@themaze.io:/var/www/html
rm -rf deploy/html
cp -R server/ deploy/server
sed -i -e 's#http\.ListenAndServe(":8000", nil)#http\.ListenAndServeTLS(":8000", "certs/cert\.pem", "certs/key\.pem", nil)#g' deploy/server/server.go
scp deploy/server/game.go bnwlkr@themaze.io:~/go/src/maze/game/game.go
scp deploy/server/server.go bnwlkr@themaze.io:~/go/src/maze/server/server.go
