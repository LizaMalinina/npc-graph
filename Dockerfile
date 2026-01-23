# Development Dockerfile for NPC Graph
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma, canvas (for react-force-graph), and development
RUN apk add --no-cache openssl python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for development)
RUN npm install

# Copy prisma schema and env for generation
COPY prisma ./prisma/
COPY .env ./

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port Next.js runs on
EXPOSE 3000

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'npx prisma db push' >> /entrypoint.sh && \
    echo 'if [ ! -f /app/prisma/.seeded ]; then' >> /entrypoint.sh && \
    echo '  npx tsx prisma/seed.ts && touch /app/prisma/.seeded' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'exec npm run dev' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
