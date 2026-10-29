package auth

import "time"

type User struct {
	ID            int64
	Email         string
	PasswordHash  string
	DisplayName   string
	RoleID        int
	EmailVerified bool
	Balance       string
	CreatedAt     time.Time
}

type Session struct {
	ID        int64
	UserID    int64
	TokenHash string
	UserAgent string
	IP        string
	ExpiresAt time.Time
	RevokedAt *time.Time
	CreatedAt time.Time
}
