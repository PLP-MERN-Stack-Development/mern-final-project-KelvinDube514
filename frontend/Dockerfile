FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY public/robots.txt /usr/share/nginx/html/robots.txt
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


