FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY .env.example ./env.example

# Expose and run
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "src/server.js"]


