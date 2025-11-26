FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim
WORKDIR /app

# All environment variables in one layer
ENV UV_SYSTEM_PYTHON=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_NO_PROGRESS=1 \
    PYTHONUNBUFFERED=1 \
    DOCKER_CONTAINER=1 \
    AWS_REGION=ap-southeast-2 \
    AWS_DEFAULT_REGION=ap-southeast-2 \
    BEDROCK_AGENTCORE_MEMORY_ID=agent1_assessment_mem-N7E5182elb \
    BEDROCK_AGENTCORE_MEMORY_NAME=agent1_assessment_mem \
    DISABLE_ADOT_OBSERVABILITY=true



COPY requirements.txt requirements.txt
# Install from requirements file
RUN uv pip install -r requirements.txt




RUN uv pip install aws-opentelemetry-distro>=0.10.1


# Signal that this is running in Docker for host binding logic
ENV DOCKER_CONTAINER=1

# Create non-root user
RUN useradd -m -u 1000 bedrock_agentcore

# Copy guidelines before switching user
COPY guidelines/ /app/guidelines/

USER bedrock_agentcore

EXPOSE 9000
EXPOSE 8000
EXPOSE 8080

# Copy entire project (respecting .dockerignore)
COPY . .

# Run the agent entrypoint directly
CMD ["opentelemetry-instrument", "python", "agent.py"]
