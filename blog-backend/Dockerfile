# Specify base image
FROM node:18-alpine

# Specify working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 8080 (Back4app requirement)
EXPOSE 8080

# Run the app
CMD ["npm", "start"]
