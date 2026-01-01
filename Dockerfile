FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    vim \
    tree \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 -s /bin/bash developer

WORKDIR /workspace

USER developer

RUN curl -fsSL https://claude.ai/install.sh | bash

RUN mkdir -p /home/developer/.config/claude && \
    echo '{"model": "sonnet"}' > /home/developer/.config/claude/settings.json

ENV PATH="/home/developer/.local/bin:${PATH}"

EXPOSE 8080

CMD ["/workspace/harness/start-http-server.sh"]
