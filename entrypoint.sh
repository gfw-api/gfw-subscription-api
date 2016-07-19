#!/bin/bash
set -e

case "$1" in
    develop)
        echo "Running Development Server"
        export DEBUG=*
        exec  grunt --gruntfile app/Gruntfile.js | bunyan
        ;;
    startDev)
        echo "Running Start Dev"
        exec node app/index
        ;;
    test)
        echo "Running Test"
        exec grunt --gruntfile app/Gruntfile.js test
        ;;
    start)
        echo "Running Start"
        exec pm2 start --env NODE_PATH:app/src app/index.js --no-daemon -i ${WORKERS}
        ;;
    *)
        exec "$@"
esac
