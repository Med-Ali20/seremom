# Use Node 22 for compatibility with your NestJS 11 features
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Expose the internal port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]