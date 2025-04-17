#!/bin/bash

case "$1" in
    start)
        yarn start
        ;;
    develop)
        type docker compose >/dev/null 2>&1 || { echo >&2 "docker compose is required but it's not installed.  Aborting."; exit 1; }
        docker compose -f docker-compose-develop.yml build && docker compose -f docker-compose-develop.yml up --abort-on-container-exit
        ;;
    test)
        type docker compose >/dev/null 2>&1 || { echo >&2 "docker-compose is required but it's not installed.  Aborting."; exit 1; }
        EXIT_CODE=0

        GADM_VERSION=3.6 docker compose -f docker-compose-test.yml build && \
        GADM_VERSION=3.6 docker compose -f docker-compose-test.yml up --abort-on-container-exit
        (( EXIT_CODE |= $? ))  # Bitwise OR to capture any failure

        GADM_VERSION=4.1 TEST_CMD=test4_1 docker compose -f docker-compose-test.yml build && \
        GADM_VERSION=4.1 TEST_CMD=test4_1 docker compose -f docker-compose-test.yml up --abort-on-container-exit
        (( EXIT_CODE |= $? ))  # Bitwise OR to capture any failure

        if [ $EXIT_CODE -eq 0 ]; then
            echo ""
            echo "SUCCESS: All tests passed!"
        else
            echo ""
            echo "ERROR: Some tests failed!" >&2
        fi

        exit $EXIT_CODE
        ;;
    *)
        echo "Usage: subscription.sh {start|develop|test}" >&2
        exit 1
        ;;
esac

exit 0
