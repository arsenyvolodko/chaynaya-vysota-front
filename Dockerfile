FROM node:20-alpine AS build
WORKDIR /app
# build-time override: можно прокинуть `--build-arg VITE_API_BASE_URL=...`
# на разные окружения. Дефолт — прод.
ARG VITE_API_BASE_URL=https://chaynaya-vysota.ru
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
# CMD не указан — наследуем дефолтный entrypoint+CMD nginx:alpine
# (`nginx -g 'daemon off;'`).
