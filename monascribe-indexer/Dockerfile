# Dockerfile for Envio Indexer deployment
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Set environment variables
ENV HASURA_GRAPHQL_ENDPOINT=http://localhost:4000/v1/metadata
ENV HASURA_GRAPHQL_ROLE=admin
ENV HASURA_GRAPHQL_ADMIN_SECRET=testing
ENV ENVIO_INDEXER_PORT=4000
ENV NODE_ENV=production
ENV ENVIO_HASURA=true

# PostgreSQL configuration
ENV ENVIO_PG_HOST=localhost
ENV ENVIO_PG_PORT=5433
ENV ENVIO_PG_USER=postgres
ENV ENVIO_PG_PASSWORD=testing
ENV ENVIO_PG_DATABASE=envio-dev
ENV ENVIO_PG_SSL_MODE=disable

# Throttle configuration
ENV ENVIO_THROTTLE_CHAIN_METADATA_INTERVAL_MILLIS=500
ENV ENVIO_THROTTLE_PRUNE_STALE_DATA_INTERVAL_MILLIS=1000
ENV ENVIO_THROTTLE_LIVE_METRICS_BENCHMARK_INTERVAL_MILLIS=2000
ENV ENVIO_THROTTLE_JSON_FILE_BENCHMARK_INTERVAL_MILLIS=5000

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate code and build
RUN pnpm codegen && pnpm build

# Expose port
EXPOSE 4000

# Start the indexer
CMD ["pnpm", "start"]
