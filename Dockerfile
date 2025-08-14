FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (none for this project, but good practice)
RUN npm ci --only=production

# Copy application files
COPY . .

# Create phishing_logs directory
RUN mkdir -p phishing_logs

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
