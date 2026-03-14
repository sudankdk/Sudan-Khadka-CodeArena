# syntax=docker/dockerfile:1
FROM golang:1.24.10 AS builder
WORKDIR /src

# Download dependencies
COPY go.mod go.sum ./
RUN go env -w GOPROXY=https://proxy.golang.org,direct && go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /app/backend ./main.go

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/backend ./

EXPOSE 8080
ENTRYPOINT ["/app/backend"]
