#!/bin/bash

URL=http://127.0.0.1:9545
# URL=https://mainnet.optimism.io

function json() {
    #echo '{"method": "debug_traceTransaction", "params": ['"$1"', {"tracer": "callTracer"}]}'
    #echo '{"id":0, "jsonrpc": "2.0", "method": "debug_traceTransaction", "params": ["'"$1"'", {"tracer": "callTracer"}]}'
    echo '{"id":0, "method": "debug_traceTransaction", "params": ["'"$1"'", {}]}'
}

HASH=$1

JSON=$(json $HASH)

curl --silent -H "Content-Type: application/json" \
    -d "$JSON" \
    $URL