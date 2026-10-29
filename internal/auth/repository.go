package auth

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ---------- users ----------

func (r *Repository) CreateUser(ctx context.Context, email, passwordHash, displayName string, roleID int) (*User, error) {
	const q = `
		INSERT INTO users (email, password_hash, display_name, role_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, password_hash, display_name, role_id,
		          email_verified, balance::text, created_at`
	var u User
	err := r.db.QueryRow(ctx, q, email, passwordHash, displayName, roleID).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.RoleID,
		&u.EmailVerified, &u.Balance, &u.CreatedAt,
	)
	return &u, err
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	const q = `
		SELECT id, email, password_hash, display_name, role_id,
		       email_verified, balance::text, created_at
		FROM users
		WHERE email = $1`
	var u User
	err := r.db.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.RoleID,
		&u.EmailVerified, &u.Balance, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *Repository) GetUserByID(ctx context.Context, id int64) (*User, error) {
	const q = `
		SELECT id, email, password_hash, display_name, role_id,
		       email_verified, balance::text, created_at
		FROM users
		WHERE id = $1`
	var u User
	err := r.db.QueryRow(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.RoleID,
		&u.EmailVerified, &u.Balance, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *Repository) CreateSession(ctx context.Context, userID int64, tokenHash, userAgent, ip string, ttl time.Duration) (*Session, error) {
	const q = `
		INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, '')::inet, $5)
		RETURNING id, user_id, token_hash, COALESCE(user_agent, ''),
		          COALESCE(ip::text, ''), expires_at, revoked_at, created_at`
	var s Session
	err := r.db.QueryRow(ctx, q, userID, tokenHash, userAgent, ip, time.Now().Add(ttl)).Scan(
		&s.ID, &s.UserID, &s.TokenHash, &s.UserAgent, &s.IP,
		&s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)
	return &s, err
}

func (r *Repository) GetActiveSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, error) {
	const q = `
		SELECT id, user_id, token_hash, COALESCE(user_agent, ''),
		       COALESCE(ip::text, ''), expires_at, revoked_at, created_at
		FROM sessions
		WHERE token_hash = $1
		  AND revoked_at IS NULL
		  AND expires_at > now()`
	var s Session
	err := r.db.QueryRow(ctx, q, tokenHash).Scan(
		&s.ID, &s.UserID, &s.TokenHash, &s.UserAgent, &s.IP,
		&s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &s, err
}

func (r *Repository) RevokeSession(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx,
		`UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, id)
	return err
}

func (r *Repository) RevokeAllUserSessions(ctx context.Context, userID int64) error {
	_, err := r.db.Exec(ctx,
		`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	return err
}
