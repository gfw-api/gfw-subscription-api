#!/bin/bash
set -e

case "$1" in
    develop)
        echo "Running Development Server"
        exec yarn watch
        ;;
    test)
        echo "Running Test"
        exec yarn test
        ;;
    test4_1)
        echo "Running Tests for GADM 4.1"
        exec yarn test:4_1
        ;;
    start)
        echo "Running Start"
        exec yarn start
        ;;
    *)
        exec "$@"
esac
