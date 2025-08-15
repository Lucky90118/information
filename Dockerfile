FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install necessary packages for production
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies (none for this project, but good practice)
RUN npm ci --only=production

# Copy application files
COPY . .

# Create phishing_logs directory with proper permissions
RUN mkdir -p phishing_logs && chown -R nodejs:nodejs /app

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
