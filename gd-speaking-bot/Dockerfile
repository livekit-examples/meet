# syntax=docker/dockerfile:1

# Use the official Node.js v24 base image
# We use the slim variant to keep the image size smaller while still having essential tools
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base

# Configure pnpm installation directory and ensure it is on PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HOME="/app"

# Install ca-certificates (the system CA bundle used for TLS), then clean
# the apt cache. Required by the LiveKit SDK: the native Rust core reads
# the system trust store at runtime, which the slim base image doesn't ship.
# --no-install-recommends keeps the image minimal.
RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Pin pnpm version for reproducible builds
RUN npm install -g pnpm@10

# --- Build stage ---
# Install dependencies, build the project, and prepare production assets
FROM base AS build

# Create a new directory for our application code
# And set it as the working directory
WORKDIR /app

# Copy just the dependency files first, for more efficient layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
# --frozen-lockfile ensures we use exact versions from pnpm-lock.yaml for reproducible builds
RUN pnpm install --frozen-lockfile

# Pre-download any ML models or files the agent needs
# This runs before COPY . . so the download layer is cached across code-only changes.
# The standalone CLI discovers installed @livekit/agents-plugin-* packages without
# loading your agent code.
RUN npx livekit-agents download-files

# Copy all remaining application files into the container
# This includes source code, configuration files, and dependency specifications
# (Excludes files specified in .dockerignore)
COPY . .

# Remove dev dependencies for a leaner production image
RUN pnpm prune --prod

# --- Production stage ---
FROM base

# Create a non-privileged user that the app will run under
# See https://docs.docker.com/build/building/best-practices/#user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

WORKDIR /app

# Copy the built application with correct ownership in a single layer
# This avoids expensive recursive chown operations on node_modules
COPY --from=build --chown=appuser:appuser /app /app

USER appuser

# Set Node.js to production mode
ENV NODE_ENV=production

# Run Node as PID 1 so SIGTERM reaches the worker and active jobs can drain.
# The "start" command tells the worker to connect to LiveKit and begin waiting for jobs.
CMD [ "node", "src/main.ts", "start" ]
