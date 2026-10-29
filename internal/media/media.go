package media

import "strings"

// Resolver turns a stored object key into a browser-friendly URL.
// Seeded listings may contain absolute URLs; those are returned as is.
type Resolver struct {
	Base string
}

func NewResolver(base string) *Resolver {
	return &Resolver{Base: strings.TrimRight(base, "/")}
}

func (r *Resolver) URL(key string) string {
	if key == "" {
		return ""
	}
	if strings.HasPrefix(key, "http://") || strings.HasPrefix(key, "https://") {
		return key
	}
	if r == nil || r.Base == "" {
		return key
	}
	return r.Base + "/" + strings.TrimLeft(key, "/")
}
