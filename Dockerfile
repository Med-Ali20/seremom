FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDeps like @nestjs/cli) 
# so we can run the build
RUN npm install

# Copy everything else
COPY . .

# Generate Prisma Client (critical for the build to pass)
RUN npx prisma generate

# Run the build - this creates the /app/dist folder
RUN npm run build

# Expose NestJS default port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]