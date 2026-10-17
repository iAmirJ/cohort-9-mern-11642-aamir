#1. Base Image: Node.js version 20 ka Alpine linux version
# Alpine linux bohot lightweight hota hai, sirf 5 MB ka, jis se image super fast banti hy.
FROM node:20-alpine


#2. Container ke ander hamara working folder
WORKDIR /app

#3. Pehle sirf package files copy krein
# Docker caching: ager mera code change hota and package wahi same rahta hy to npm install dobara run nahi hoga.
COPY package*.json ./

#4. Sari dependencies install karni hy
RUN npm install

#5 Baki sara project code container mien copy krna
COPY . .

#6 Expose container on port 5000 
EXPOSE 5000

#7. Container start hone per ye command run kre.
CMD ["npm", "start"]