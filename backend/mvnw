#!/bin/sh
# Maven Wrapper script
# Downloads Maven if not available and runs it

set -e

MAVEN_PROJECTBASEDIR="${MAVEN_BASEDIR:-$(cd "$(dirname "$0")" && pwd)}"
MAVEN_WRAPPER_PROPERTIES="$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.properties"

if [ -f "$MAVEN_WRAPPER_PROPERTIES" ]; then
    MAVEN_URL=$(grep "distributionUrl" "$MAVEN_WRAPPER_PROPERTIES" | cut -d'=' -f2-)
fi

MAVEN_HOME="$HOME/.m2/wrapper/dists/apache-maven-3.9.6"

if [ ! -f "$MAVEN_HOME/bin/mvn" ]; then
    echo "Downloading Maven..."
    mkdir -p "$MAVEN_HOME"
    if command -v curl > /dev/null 2>&1; then
        curl -fsSL "$MAVEN_URL" -o /tmp/maven.zip
    elif command -v wget > /dev/null 2>&1; then
        wget -q "$MAVEN_URL" -O /tmp/maven.zip
    fi
    unzip -qo /tmp/maven.zip -d "$MAVEN_HOME" 2>/dev/null || true
    # Handle nested directory
    if [ -d "$MAVEN_HOME/apache-maven-3.9.6" ]; then
        mv "$MAVEN_HOME/apache-maven-3.9.6"/* "$MAVEN_HOME/" 2>/dev/null || true
    fi
    rm -f /tmp/maven.zip
fi

exec "$MAVEN_HOME/bin/mvn" "$@"
