# syntax=docker/dockerfile:1
FROM golang:1.24.10 AS builder
WORKDIR /src

# Download dependencies first
COPY go.mod go.sum ./
RUN go env -w GOPROXY=https://proxy.golang.org,direct && go mod download

# Copy source and build binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /app/cee ./main.go

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/cee ./
# include language metadata required at runtime
COPY --from=builder /src/internal/languages /app/internal/languages

EXPOSE 3000
ENTRYPOINT ["/app/cee"]
