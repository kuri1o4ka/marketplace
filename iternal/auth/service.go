package auth

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"
)

const (
	sessionTTL     = 30 * 24 * time.Hour
	MinPasswordLen = 8
	MaxPasswordLen = 200
)

type Service struct {
	repo  *Repository
	cache *SessionCache
	log   *slog.Logger
}

func NewService(repo *Repository, cache *SessionCache, log *slog.Logger) *Service {
	return &Service{repo: repo, cache: cache, log: log}
}

type RegisterInput struct {
	Email       string
	Password    string
	DisplayName string
}

func (s *Service) Register(ctx context.Context, in RegisterInput) (string, *User, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if !ValidEmail(email) {
		return "", nil, ErrInvalidCredentials
	}

	if len(in.Password) < MinPasswordLen || len(in.Password) > MaxPasswordLen {
		return "", nil, errors.New("password length invalid")
	}

	if strings.TrimSpace(in.DisplayName) == "" {
		return "", nil, errors.New("display name required")
	}

	existing, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", nil, err
	}
	if existing != nil {
		return "", nil, ErrEmailTaken
	}

	hash, err := HashPassword(in.Password)
	if err != nil {
		return "", nil, err
	}
	roleID, err := s.repo.GetRoleIdByName(ctx, "user")
	if err != nil {
		return "", nil, err
	}

	u, err := s.repo.CreateUser(ctx, email, hash, in.DisplayName, roleID)
	if err != nil {
		return "", nil, err
	}

	token, err := s.CreateSession(ctx, u.ID, "", "")
	if err != nil {
		return "", nil, err
	}
	return token, u, nil
}

type LoginInput struct {
	Email     string
	Password  string
	UserAgent string
	IP        string
}

func (s *Service) Login(ctx context.Context, in LoginInput) (string, *User, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))

	u, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", nil, err
	}

	if u == nil {
		_ = VerifyPasswordConst()
		return "", nil, ErrInvalidCredentials
	}

	ok, err := VerifyPassword(in.Password, u.PasswordHash)
	if err != nil {
		return "", nil, err
	}
	if !ok {
		return "", nil, ErrInvalidCredentials
	}

	token, err := s.CreateSession(ctx, u.ID, in.UserAgent, in.IP)
	if err != nil {
		return "", nil, err
	}
	return token, u, nil
}

func (s *Service) Authunticate(ctx context.Context, token string) (*User, error) {
	if token == "" {
		return nil, ErrSessionNotFound
	}
	tokenHash := HashToToken(token)

	userID, ok, err := s.cache.Get(ctx, tokenHash)
	if err != nil {
		s.log.Warn("session cache get failed", "err", err)
	}
	if !ok {
		sess, err := s.repo.GetActiveSessionByTokenHash(ctx, tokenHash)
		if err != nil {
			return nil, err
		}

		if sess == nil {
			return nil, ErrSessionNotFound
		}
		userID = sess.UserID

		ttl := time.Until(sess.ExpiresAt)
		if ttl > 0 {
			_ = s.cache.Set(ctx, tokenHash, userID, ttl)
		}
	}

	u, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if u == nil {
		return nil, ErrSessionNotFound
	}

	return u, nil
}

func (s *Service) CreateSession(ctx context.Context, userID int64, ua, ip string) (string, error) {
	token, err := NewToken()
	if err != nil {
		return "", err
	}
	hash := HashToToken(token)

	sess, err := s.repo.CreateSession(ctx, userID, hash, ua, ip, sessionTTL)
	if err != nil {
		return "", nil
	}

	ttl := time.Until(sess.ExpiresAt)
	if err := s.cache.Set(ctx, hash, userID, ttl); err != nil {
		s.log.Warn("session cache get failed", "err", err)
	}

	return token, nil
}

func ValidEmail(s string) bool {
	at := strings.IndexByte(s, '@')
	return at > 0 && at < len(s)-1 && !strings.ContainsAny(s, "\t\n")
}
