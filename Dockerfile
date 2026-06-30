# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps with a clean, reproducible install
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the static site
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# App listens on 8789 by default (override with PORT env at run time)
ENV PORT=8789

# nginx config template — PORT is substituted at container start
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8789
# nginx:alpine entrypoint runs envsubst over /etc/nginx/templates/*.template
CMD ["nginx", "-g", "daemon off;"]
