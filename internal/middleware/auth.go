package middleware

import (
	"net/http"
	"strings"

	"github.com/falsefeelings/internal/auth"
)

func Auth(svc *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := bearer(r)
			if token == "" {
				http.Error(w, `{"error": "unauthorized"}`, http.StatusUnauthorized)
				return
			}
			u, err := svc.Authenticate(r.Context(), token)
			if err != nil {
				http.Error(w, `{"error": "unathorized"}`, http.StatusUnauthorized)
				return
			}
			ctx := auth.WithUser(r.Context(), u)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	const p = "Bearer "
	if !strings.HasPrefix(h, p) {
		return ""
	}
	return strings.TrimSpace(h[len(p):])
}
