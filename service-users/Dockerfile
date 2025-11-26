from node:18
workdir /app
copy package*.json ./
run npm install
copy . .
cmd ["node", "index.js"]