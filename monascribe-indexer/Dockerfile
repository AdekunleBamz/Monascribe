# Dockerfile for Envio Indexer deployment
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

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
