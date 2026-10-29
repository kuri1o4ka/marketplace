package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/falsefeelings/internal/auction"
	"github.com/falsefeelings/internal/auth"
	"github.com/falsefeelings/internal/cart"
	"github.com/falsefeelings/internal/listing"
	"github.com/falsefeelings/internal/media"
	mw "github.com/falsefeelings/internal/middleware"
	"github.com/falsefeelings/internal/moderation"
	"github.com/falsefeelings/internal/order"
	"github.com/falsefeelings/internal/storage"
	"github.com/falsefeelings/internal/upload"
	"github.com/falsefeelings/internal/wallet"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	dbURL := env("DATABASE_URL", "postgres://app:app@localhost:5432/vintage?sslmode=disable")
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Error("pg connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	redisAddr := env("REDIS_ADDR", "localhost:6379")
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Error("redis ping failed", "err", err)
		os.Exit(1)
	}

	mediaResolver := media.NewResolver(env("MINIO_PUBLIC_URL", "http://localhost:9000/polyclothes"))

	store, err := storage.New(
		env("MINIO_ENDPOINT", "localhost:9000"),
		env("MINIO_ACCESS_KEY", "minioadmin"),
		env("MINIO_SECRET_KEY", "minioadmin"),
		env("MINIO_BUCKET", "polyclothes"),
		env("MINIO_PUBLIC_URL", "http://localhost:9000/polyclothes"),
		envBool("MINIO_USE_SSL", false),
	)
	if err != nil {
		log.Warn("object storage init failed, uploads disabled", "err", err)
		store = nil
	} else if err := store.EnsureBucket(ctx); err != nil {
		log.Warn("object storage bucket check failed", "err", err)
	} else if err := store.SetPublicRead(ctx); err != nil {
		log.Warn("object storage public policy failed", "err", err)
	}

	authRepo := auth.NewRepository(pool)
	authCache := auth.NewSessionCache(rdb)
	authSvc := auth.NewService(authRepo, authCache, log)
	authHandler := auth.NewHandler(authSvc)

	listingRepo := listing.NewRepository(pool, mediaResolver)
	listingSvc := listing.NewService(listingRepo)
	listingHandler := listing.NewHandler(listingSvc)

	moderationRepo := moderation.NewRepository(pool)
	moderationSvc := moderation.NewService(moderationRepo)
	moderationHandler := moderation.NewHandler(moderationSvc)

	cartRepo := cart.NewRepository(pool, mediaResolver)
	cartSvc := cart.NewService(cartRepo)
	cartHandler := cart.NewHandler(cartSvc)

	orderRepo := order.NewRepository(pool, mediaResolver)
	orderSvc := order.NewService(orderRepo)
	orderHandler := order.NewHandler(orderSvc)

	walletRepo := wallet.NewRepository(pool)
	walletSvc := wallet.NewService(walletRepo)
	walletHandler := wallet.NewHandler(walletSvc)

	auctionRepo := auction.NewRepository(pool, mediaResolver)
	auctionSvc := auction.NewService(auctionRepo)
	auctionHandler := auction.NewHandler(auctionSvc)

	uploadHandler := upload.NewHandler(store)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			if err := pool.Ping(r.Context()); err != nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				w.Write([]byte(`{"status":"db_error"}`))
				return
			}
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		})

		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Group(func(r chi.Router) {
				r.Use(mw.Auth(authSvc))
				r.Post("/logout", authHandler.Logout)
				r.Post("/logout-all", authHandler.LogoutAll)
				r.Get("/me", authHandler.Me)
			})
		})

		r.Get("/categories", listingHandler.GetCategories)
		r.Get("/brands", listingHandler.GetBrands)

		r.Route("/listings", func(r chi.Router) {
			r.Get("/", listingHandler.GetListings)
			r.Get("/{id}", listingHandler.GetListing)
			r.Group(func(r chi.Router) {
				r.Use(mw.Auth(authSvc))
				r.Post("/", listingHandler.CreateListing)
				r.Get("/mine", listingHandler.GetMyListings)
				r.Post("/{id}/ai-check", listingHandler.AICheck)
			})
		})

		r.With(mw.Auth(authSvc)).Post("/uploads", uploadHandler.Upload)
		r.With(mw.Auth(authSvc)).Post("/ai/check", listingHandler.AICheckImages)

		r.Route("/moderation", func(r chi.Router) {
			r.Use(mw.Auth(authSvc))
			r.Use(mw.RequireRole("moderator", "admin"))
			r.Get("/pending", moderationHandler.GetPending)
			r.Post("/{id}/approve", moderationHandler.Approve)
			r.Post("/{id}/reject", moderationHandler.Reject)
		})

		r.Route("/cart", func(r chi.Router) {
			r.Use(mw.Auth(authSvc))
			r.Get("/", cartHandler.GetCart)
			r.Delete("/", cartHandler.ClearCart)
			r.Post("/items", cartHandler.AddItem)
			r.Delete("/items/{listing_id}", cartHandler.RemoveItem)
		})

		r.Route("/orders", func(r chi.Router) {
			r.Use(mw.Auth(authSvc))
			r.Post("/checkout", orderHandler.Checkout)
			r.Get("/", orderHandler.GetMyOrders)
			r.Get("/{id}", orderHandler.GetOrder)
		})

		r.Route("/wallet", func(r chi.Router) {
			r.Use(mw.Auth(authSvc))
			r.Get("/", walletHandler.GetWallet)
			r.Post("/deposit", walletHandler.Deposit)
		})

		r.Route("/auctions", func(r chi.Router) {
			r.Get("/", auctionHandler.GetAll)
			r.Get("/{id}", auctionHandler.GetByID)
			r.Group(func(r chi.Router) {
				r.Use(mw.Auth(authSvc))
				r.Post("/", auctionHandler.Create)
				r.Post("/{id}/bids", auctionHandler.PlaceBid)
			})
		})
	})

	srv := &http.Server{
		Addr:         env("HTTP_ADDR", ":8080"),
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		log.Info("starting server", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("http server error", "err", err)
		}
	}()

	<-ctx.Done()
	log.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("server forced to shutdown", "err", err)
	}
	log.Info("server gracefully stopped")
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
