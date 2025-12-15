FROM node:20

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies (installs express, axios, etc.)
RUN npm install

# Copy rest of the code
COPY . .

EXPOSE 5000

# Use your npm dev script
CMD ["npm", "run", "dev"]