FROM golang:1.16-alpine3.12 AS builder

COPY main.go  /go/src/example.com/
WORKDIR /go/src/example.com/

# Toggle CGO based on your app requirement. CGO_ENABLED=1 for enabling CGO
RUN go mod init && go mod tidy && go build -o /go/src/go/src/example.com/appbin *.go
# Use below if using vendor
# RUN CGO_ENABLED=0 go build -mod=vendor -ldflags '-s -w -extldflags "-static"' -o /app/appbin *.go

FROM alpine:3.12
LABEL MAINTAINER Author <neilkuanpro@gmail.com>

# Following commands are for installing CA certs (for proper functioning of HTTPS and other TLS)
RUN apk --update add ca-certificates && \
    rm -rf /var/cache/apk/*

# Add new user 'appuser'
RUN adduser -D appuser
USER appuser

COPY --from=builder /go/src/go/src/example.com/ /home/appuser/app

WORKDIR /home/appuser/app

CMD ["./appbin"]