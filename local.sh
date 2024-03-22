#watchify src/js/main.js -o src/build.js &
#cd src/ && php -S localhost:8000
watchify src/js/main.js -o src/build.js &
cd src/ && python -m http.server

