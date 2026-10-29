package auth

import "errors"

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidEmail       = errors.New("invalid email")
	ErrEmailTaken         = errors.New("email already taken")
	ErrSessionNotFound    = errors.New("session not found")
	ErrSessionExpired     = errors.New("session expired")
	ErrUserBlocked        = errors.New("user blocked")
	ErrWeakPassword       = errors.New("weak password")
)
