# 
FROM node:22-alpine

# Set Working Directory
WORKDIR /app

# Copy Packages
COPY package*.json .

# Install Dependencies for Project
RUN npm install

# Copy Rest of App Code
COPY . . 

#Expose the Port in order to make app public
EXPOSE 5003

#Define the Run Command for App
CMD ["node", "-r", "dotenv/config", "./src/server.js"]





