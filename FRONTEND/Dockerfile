FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]