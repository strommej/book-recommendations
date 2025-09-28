#!/bin/bash
docker build -f Dockerfile.opensearch -t opensearch-dev .
docker run -d --name opensearch-dev \
  -p 9200:9200 -p 9600:9600 opensearch-dev