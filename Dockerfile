FROM node:20-slim

# Install Java
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk && \
    apt-get install -y coreutils && \
    useradd -m runner

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

USER runner

EXPOSE 3000

CMD ["npm", "start"]
