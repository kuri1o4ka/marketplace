package upload

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/falsefeelings/internal/storage"
)

const (
	MaxFiles    = 3
	MaxFileSize = 10 << 20 // 10 MB
)

var allowedTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type Handler struct {
	store *storage.Storage
}

func NewHandler(store *storage.Storage) *Handler {
	return &Handler{store: store}
}

type imageResponse struct {
	Key string `json:"key"`
	URL string `json:"url"`
}

type uploadResponse struct {
	Images []imageResponse `json:"images"`
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if h.store == nil {
		writeError(w, http.StatusServiceUnavailable, "storage is not configured")
		return
	}

	if err := r.ParseMultipartForm(MaxFiles * MaxFileSize); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		files = r.MultipartForm.File["file"]
	}
	if len(files) == 0 {
		writeError(w, http.StatusBadRequest, "no files provided")
		return
	}
	if len(files) > MaxFiles {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("max %d files allowed", MaxFiles))
		return
	}

	images := make([]imageResponse, 0, len(files))
	for _, header := range files {
		key, err := h.save(r, header)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		images = append(images, imageResponse{Key: key, URL: h.store.URL(key)})
	}

	writeJSON(w, http.StatusCreated, uploadResponse{Images: images})
}

func (h *Handler) save(r *http.Request, header *multipart.FileHeader) (string, error) {
	if header.Size > MaxFileSize {
		return "", fmt.Errorf("file %q is larger than 10 MB", header.Filename)
	}

	contentType := strings.Split(header.Header.Get("Content-Type"), ";")[0]
	ext, ok := allowedTypes[contentType]
	if !ok {
		return "", fmt.Errorf("file %q has unsupported type %q", header.Filename, contentType)
	}

	src, err := header.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	name := make([]byte, 12)
	if _, err := rand.Read(name); err != nil {
		return "", err
	}

	key := filepath.ToSlash(fmt.Sprintf(
		"listings/%s/%s%s",
		time.Now().Format("2006/01"),
		hex.EncodeToString(name),
		ext,
	))

	if err := h.store.Put(r.Context(), key, io.LimitReader(src, MaxFileSize), header.Size, contentType); err != nil {
		return "", errors.New("failed to store file")
	}
	return key, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
