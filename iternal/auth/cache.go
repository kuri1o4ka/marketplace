package auth

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type SessionCache struct {
	rdb *redis.Client
}

func NewSessionCache(rdb *redis.Client) *SessionCache {
	return &SessionCache{rdb: rdb}
}

func (c *SessionCache) key(tokenHash string) string {
	return "sess:" + tokenHash
}

func (c *SessionCache) Set(ctx context.Context, tokenHash string, userID int64, ttl time.Duration) error {
	return c.rdb.Set(ctx, c.key(tokenHash), userID, ttl).Err()
}

func (c *SessionCache) Get(ctx context.Context, tokenHash string) (int64, bool, error) {
	v, err := c.rdb.Get(ctx, c.key(tokenHash)).Result()
	if errors.Is(err, redis.Nil) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	id, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return 0, false, fmt.Errorf("bad sess value: %w", err)
	}
	return id, true, nil
}

func (c *SessionCache) Delete(ctx context.Context, tokenHash string) error {
	return c.rdb.Del(ctx, c.key(tokenHash)).Err()
}
