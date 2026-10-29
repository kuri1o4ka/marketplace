package listing

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/falsefeelings/internal/auth"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc Service
}

func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetListings(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := CatalogFilter{
		Query:      q.Get("q"),
		Condition:  q.Get("condition"),
		SaleType:   q.Get("sale_type"),
		Sort:       q.Get("sort"),
		CategoryID: intPtr(q.Get("category_id")),
		BrandID:    intPtr(q.Get("brand_id")),
		MinPrice:   floatPtr(q.Get("min_price")),
		MaxPrice:   floatPtr(q.Get("max_price")),
	}
	f.Page, _ = strconv.Atoi(q.Get("page"))
	f.Limit, _ = strconv.Atoi(q.Get("limit"))

	page, err := h.svc.GetCatalog(r.Context(), f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load catalog")
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h *Handler) GetListing(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	listing, err := h.svc.GetListing(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "listing not found")
		return
	}
	writeJSON(w, http.StatusOK, listing)
}

func (h *Handler) GetMyListings(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	items, err := h.svc.GetMyListings(r.Context(), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load listings")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) CreateListing(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateListingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}

	id, err := h.svc.CreateListing(r.Context(), user.ID, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) GetCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.svc.GetCategories(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load categories")
		return
	}
	writeJSON(w, http.StatusOK, categories)
}

func (h *Handler) GetBrands(w http.ResponseWriter, r *http.Request) {
	brands, err := h.svc.GetBrands(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load brands")
		return
	}
	writeJSON(w, http.StatusOK, brands)
}

func (h *Handler) AICheck(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	res, err := h.svc.CheckAICondition(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AICheckImages(w http.ResponseWriter, r *http.Request) {
	var req AICheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	res, err := h.svc.CheckImages(r.Context(), req.Images)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func intPtr(v string) *int {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return nil
	}
	return &n
}

func floatPtr(v string) *float64 {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	n, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return nil
	}
	return &n
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
