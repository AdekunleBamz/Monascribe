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
