package auth

import (
	"context"
	"log/slog"
	"strings"
	"time"
)

const (
	SessionTTL     = 30 * 24 * time.Hour
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
	if !validEmail(email) {
		return "", nil, ErrInvalidEmail
	}
	if len(in.Password) < MinPasswordLen || len(in.Password) > MaxPasswordLen {
		return "", nil, ErrWeakPassword
	}
	if strings.TrimSpace(in.DisplayName) == "" {
		return "", nil, ErrInvalidCredentials
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

	// ХАРДКОД: Всегда назначаем роль "user" (ID = 1), чтобы не искать её в БД
	roleID := 1

	u, err := s.repo.CreateUser(ctx, email, hash, in.DisplayName, roleID)
	if err != nil {
		return "", nil, err
	}

	token, err := s.createSession(ctx, u.ID, "", "")
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
		VerifyPasswordConst()
		return "", nil, ErrInvalidCredentials
	}

	ok, err := VerifyPassword(in.Password, u.PasswordHash)
	if err != nil {
		return "", nil, err
	}
	if !ok {
		return "", nil, ErrInvalidCredentials
	}

	token, err := s.createSession(ctx, u.ID, in.UserAgent, in.IP)
	if err != nil {
		return "", nil, err
	}
	return token, u, nil
}

func (s *Service) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	hash := HashToToken(token)
	_ = s.cache.Delete(ctx, hash)

	sess, err := s.repo.GetActiveSessionByTokenHash(ctx, hash)
	if err != nil {
		return err
	}
	if sess == nil {
		return nil
	}
	return s.repo.RevokeSession(ctx, sess.ID)
}

func (s *Service) LogoutAll(ctx context.Context, userID int64) error {
	return s.repo.RevokeAllUserSessions(ctx, userID)
}

func (s *Service) Authenticate(ctx context.Context, token string) (*User, error) {
	if token == "" {
		return nil, ErrSessionNotFound
	}
	hash := HashToToken(token)

	userID, ok, err := s.cache.Get(ctx, hash)
	if err != nil {
		s.log.Warn("session cache get failed", "err", err)
	}
	if !ok {
		sess, err := s.repo.GetActiveSessionByTokenHash(ctx, hash)
		if err != nil {
			return nil, err
		}
		if sess == nil {
			return nil, ErrSessionNotFound
		}
		userID = sess.UserID
		ttl := time.Until(sess.ExpiresAt)
		if ttl > 0 {
			_ = s.cache.Set(ctx, hash, userID, ttl)
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

func (s *Service) createSession(ctx context.Context, userID int64, ua, ip string) (string, error) {
	token, err := NewToken()
	if err != nil {
		return "", err
	}
	hash := HashToToken(token)

	sess, err := s.repo.CreateSession(ctx, userID, hash, ua, ip, SessionTTL)
	if err != nil {
		return "", err
	}
	ttl := time.Until(sess.ExpiresAt)
	if err := s.cache.Set(ctx, hash, userID, ttl); err != nil {
		s.log.Warn("session cache set failed", "err", err)
	}
	return token, nil
}

func validEmail(s string) bool {
	at := strings.IndexByte(s, '@')
	return at > 0 && at < len(s)-1 && !strings.ContainsAny(s, " \t\n")
}
