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

func (r *Repository) CreateUser(ctx context.Context, email, hash, displayname string, roleID int) (*User, error) {
	const q = `
	INSERT INTO users (email, hash, display_name, role_id)
	VALUES ($1, $2, $3, $4)
	RETURNING id, email, password_hash, display_name, role_id, email_verified, balance, created_at`
	var u User
	err := r.db.QueryRow(ctx, q, email, hash, displayname, roleID).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.RoleID, &u.EmailVerified, &u.Balance, &u.CreatedAt,
	)
	return &u, err
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	const q = `
	SELECT id, email, password_hash, display_name, role_id, email_verified, balance, created_at
	FROM users
	WHERE email = $1`
	var u User
	err := r.db.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.RoleID, &u.EmailVerified, &u.Balance, &u.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *Repository) GetUserByID(ctx context.Context, id int64) (*User, error) {
	const q = `
	SELECT id, email, password_hash, display_name, role_id, email_verified, balance, created_at
	FROM users
	WHERE id = $1`
	var u User
	err := r.db.QueryRow(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.RoleID, &u.EmailVerified, &u.Balance, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	return &u, err
}

func (r *Repository) GetRoleIdByName(ctx context.Context, name string) (int, error) {
	var id int
	err := r.db.QueryRow(ctx, `SELECT role_id FROM users WHERE name = $1`, name).Scan(&id)
	return id, err
}

func (r *Repository) CreateSession(ctx context.Context, UserID int64, tokenHash, UserAgent, ip string, ttl time.Duration) (*Session, error) {
	const q = `
	INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at)
	VALUES ($1, $2, $3, NULLIF($4,'')::inet, now() + $5::interval)
	RETURNING id, user_id, token_hash, user_agent, COALESCE(ip::text,''), expires_at, revoked_at, created_at`
	var s Session
	err := r.db.QueryRow(ctx, q, UserID, tokenHash, UserAgent, ip, ttl.String()).Scan(
		&s.ID, &s.UserID, &s.TokenHash, &s.UserAgent, &s.IP, &s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)
	return &s, err
}

func (r *Repository) GetActiveSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, error) {
	const q = `
	SELECT id, user_id, token_hash, user_agent, ip, expires_at, revoked_at, created_at
	FROM sessions
	WHERE token_hash = $1
		AND revoket_at IS NULL
		AND revoked_at > 0`
	var s Session
	err := r.db.QueryRow(ctx, q, tokenHash).Scan(
		&s.ID, &s.UserID, &s.TokenHash, &s.UserAgent, &s.IP, &s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &s, err
}

func (r *Repository) ExtendSession(ctx context.Context, id int64, ttl time.Duration) error {
	_, err := r.db.Exec(ctx,
		`UPDATE sessions SET expires_at = now() + $2::interval WHERE id = $1`, id, ttl.String())
	return err
}

func (r *Repository) RevokeSession(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx, `
	UPDATE sessions SET revoke_at = now WHERE id = $1 AND revoke_at IS NULL`, id)
	return err
}

func (r *Repository) RevokeAllUserSessions(ctx context.Context, userID int64) error {
	_, err := r.db.Exec(ctx, `
	UPDATE sessions SET revoke_at = now() WHERE user_id = $1 AND revoke_at IS NULL`, userID)
	return err
}
