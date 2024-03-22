#watchify src/js/main.js -o src/build.js &
#cd src/ && php -S localhost:8000
watchify src/js/main.js -o src/build.js &
python -m http.server

