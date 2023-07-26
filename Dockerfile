FROM node:12.5-alpine

RUN apk update && apk upgrade && apk add --no-cache git

COPY package.json package.json
COPY app.js app.js
COPY index.js index.js
COPY etc/ etc/
COPY lib/ lib/

RUN npm i --production

CMD npm start
