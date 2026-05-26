# Build stage
FROM golang:1.24-alpine AS builder
WORKDIR /app/backend
RUN apk add --no-cache git

# Cache deps
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source
COPY backend/ .

# Build statically
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/server ./cmd/server

# Runtime stage
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=builder /app/server /app/server

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/server"]


