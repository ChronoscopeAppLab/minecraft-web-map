FROM golang:1.23 AS go_build
WORKDIR /build
RUN --mount=type=cache,target=/go/pkg/mod,sharing=locked \
    --mount=type=bind,source=backend/go.mod,target=backend/go.mod \
    --mount=type=bind,source=backend/go.sum,target=backend/go.sum \
    cd backend && go mod download -x
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=bind,source=backend,target=backend \
    cd backend && CGO_ENABLED=0 go build -o /backend .

FROM node:22 AS node_build
WORKDIR /build
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    --mount=type=bind,source=frontend/package.json,target=package.json \
    --mount=type=bind,source=frontend/package-lock.json,target=package-lock.json \
    npm ci
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=frontend/package.json,target=package.json \
    --mount=type=bind,source=frontend/package-lock.json,target=package-lock.json \
    --mount=type=bind,source=frontend/assets,target=assets \
    --mount=type=bind,source=frontend/src,target=src \
    --mount=type=bind,source=frontend/tsconfig.json,target=tsconfig.json \
    --mount=type=bind,source=frontend/webpack.config.js,target=webpack.config.js \
    npm run prod

FROM scratch
COPY --from=go_build /backend /backend
COPY --from=node_build /build/dist /frontend

ENV STATIC_PATH=/frontend

EXPOSE 8000

ENTRYPOINT ["/backend"]
