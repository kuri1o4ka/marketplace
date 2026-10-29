package auth

import "context"

type ctxKey int

const userCtxKey ctxKey = 1

func WithUser(ctx context.Context, u *User) context.Context {
	return context.WithValue(ctx, userCtxKey, u)
}

func UserFromContext(ctx context.Context) (*User, bool) {
	u, ok := ctx.Value(userCtxKey).(*User)
	return u, ok
}
