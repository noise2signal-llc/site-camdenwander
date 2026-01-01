FROM alpine:3.21

RUN apk add --no-cache \
    perl \
    perl-image-exiftool \
    exiftool \
    jq \
    bash

RUN addgroup -g 1000 developer && adduser -u 1000 -G developer -D developer

USER developer
WORKDIR /workspace

ENTRYPOINT ["/workspace/md-embed/image_metadata/embed-image-metadata.sh"]
