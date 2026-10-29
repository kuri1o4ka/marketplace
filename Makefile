SHELL := /bin/bash

# Load local overrides if present, so `make run/dev/migrate` see the same
# variables as docker compose.
ifneq (,$(wildcard .env))
include .env
export
endif

DB_URL ?= postgres://app:app@localhost:5432/vintage?sslmode=disable
MIGRATE_IMAGE ?= migrate/migrate:latest
API_URL ?= http://localhost:8080/api

.PHONY: up down migrate seed run dev build test lint fmt health

up:
	docker compose up -d

down:
	docker compose down

migrate:
	docker run --rm --network host \
		-v "$(CURDIR)/migrations:/migrations:Z" \
		$(MIGRATE_IMAGE) -path=/migrations -database "$(DB_URL)" up

seed:
	go run ./cmd/seed

run:
	go run ./cmd/api

dev:
	cd frontend && npm run dev

build:
	go build ./...
	cd frontend && npm run build

test:
	go test ./...

lint:
	go vet ./...

fmt:
	gofmt -w cmd internal

health:
	curl -s $(API_URL)/health; echo
