FROM node
MAINTAINER n0xx
RUN apt-get update
RUN export LC_ALL='en_US.utf8'
COPY bin/ /ratpBot
WORKDIR /ratpBot
RUN npm install
CMD ["node", "index.js"]