#!/bin/bash

echo "Building shielded-pool program..."
cargo build-sbf

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Running tests..."
cargo test -- --nocapture

echo "Done!"