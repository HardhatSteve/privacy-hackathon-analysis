FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r agenc && useradd -r -g agenc -m -d /home/agenc agenc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agenc_agent/ agenc_agent/
COPY agent.py .

# Create config directory with correct ownership
RUN mkdir -p /home/agenc/.config/agenc-moltbook \
    && chown -R agenc:agenc /home/agenc/.config \
    && chmod 700 /home/agenc/.config/agenc-moltbook

# Volume for persistent state
VOLUME ["/home/agenc/.config/agenc-moltbook"]

ENV XAI_API_KEY=""
ENV MOLTBOOK_API_KEY=""
ENV TWITTER_BEARER_TOKEN=""
ENV BAGS_API_KEY=""
ENV SOLANA_RPC_URL=""
ENV HOME="/home/agenc"

# Switch to non-root user
USER agenc

HEALTHCHECK --interval=5m --timeout=10s --start-period=30s --retries=2 \
    CMD python -c "import json; json.load(open('/home/agenc/.config/agenc-moltbook/state.json'))" || exit 1

ENTRYPOINT ["python", "agent.py"]
CMD ["run", "--interval", "4"]
