package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/falsefeelings/internal/auth"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type demoListing struct {
	Title       string
	Description string
	Price       float64
	Category    string
	Brand       string
	Condition   string
	SaleType    string
	Size        string
	Color       string
	ImageSeed   string
}

var categories = []string{
	"Куртки", "Обувь", "Аксессуары", "Джинсы", "Платья", "Свитеры", "Сумки", "Головные уборы",
}

var brands = []string{
	"Nike", "Adidas", "Levi's", "Carhartt", "Ralph Lauren",
	"Burberry", "Prada", "Champion", "Stüssy", "The North Face",
}

var demoListings = []demoListing{
	{"Винтажная куртка Carhartt Detroit", "Плотный деним, потёртости по краям, все пуговицы на месте. Архивная модель 90-х.", 18500, "Куртки", "Carhartt", "excellent", "fixed_price", "L", "Коричневый", "carhartt"},
	{"Кожаная куртка Burberry 80-х", "Натуральная кожа, подкладка в идеале, следы времени только на фурнитуре.", 64000, "Куртки", "Burberry", "good", "fixed_price", "M", "Чёрный", "burberry"},
	{"Худи Champion Reverse Weave", "Тяжёлый флис, оригинальный логотип, лёгкая катышковость.", 7200, "Свитеры", "Champion", "good", "fixed_price", "XL", "Серый", "champion"},
	{"Джинсы Levi's 501 Made in USA", "Прямой крой, красный таб, естественные фейды. Настоящий винтаж.", 15500, "Джинсы", "Levi's", "excellent", "fixed_price", "32", "Синий", "levis"},
	{"Кроссовки Nike Air Max 95 OG", "Полный комплект, оригинальная коробка, подошва без заломов.", 22000, "Обувь", "Nike", "new", "fixed_price", "43", "Серый", "nike"},
	{"Сумка Prada Nylon 90-х", "Нейлон, латунная фурнитура, минимальные следы носки.", 48000, "Сумки", "Prada", "excellent", "fixed_price", "One Size", "Чёрный", "prada"},
	{"Куртка The North Face Nuptse", "Пуховая, оригинальная, без порезов и пятен.", 27500, "Куртки", "The North Face", "excellent", "fixed_price", "M", "Чёрный", "tnf"},
	{"Свитер Ralph Lauren Cable Knit", "Крупная вязка, шерсть, винтажная бирка Polo.", 9900, "Свитеры", "Ralph Lauren", "good", "fixed_price", "L", "Кремовый", "ralph"},
	{"Кепка Stüssy Big Logo", "Архивная кепка, регулируемый ремень, лёгкие следы носки.", 4500, "Головные уборы", "Stüssy", "good", "fixed_price", "One Size", "Чёрный", "stussy"},
	{"Аукцион: Adidas Originals Track Top", "Редкая модель 80-х, идеальное состояние, три полоски и оригинальный замок.", 12000, "Куртки", "Adidas", "excellent", "auction", "M", "Синий", "adidas"},
	{"Аукцион: Levi's Denim Jacket Type III", "Классическая джинсовая куртка, редкий размер, естественная патина.", 17000, "Куртки", "Levi's", "good", "auction", "L", "Синий", "denim"},
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://app:app@localhost:5432/vintage?sslmode=disable"
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("begin: %v", err)
	}
	defer tx.Rollback(ctx)

	if err := seedCatalog(ctx, tx); err != nil {
		log.Fatalf("catalog: %v", err)
	}
	roleIDs, err := seedRoles(ctx, tx)
	if err != nil {
		log.Fatalf("roles: %v", err)
	}
	users, err := seedUsers(ctx, tx, roleIDs)
	if err != nil {
		log.Fatalf("users: %v", err)
	}
	if err := seedListings(ctx, tx, users["buyer"], users["seller"], users["seller2"]); err != nil {
		log.Fatalf("listings: %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("commit: %v", err)
	}

	fmt.Println("seed complete")
	fmt.Println("  buyer@example.com     / password123 (user, balance 250000)")
	fmt.Println("  seller@example.com    / password123 (user)")
	fmt.Println("  seller2@example.com   / password123 (user)")
	fmt.Println("  moderator@example.com / password123 (moderator)")
}

func seedCatalog(ctx context.Context, tx pgx.Tx) error {
	for _, name := range categories {
		if _, err := tx.Exec(ctx, "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", name); err != nil {
			return err
		}
	}
	for _, name := range brands {
		if _, err := tx.Exec(ctx, "INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", name); err != nil {
			return err
		}
	}
	return nil
}

func seedRoles(ctx context.Context, tx pgx.Tx) (map[string]int, error) {
	for _, name := range []string{"user", "moderator", "admin"} {
		if _, err := tx.Exec(ctx, "INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", name); err != nil {
			return nil, err
		}
	}

	rows, err := tx.Query(ctx, "SELECT id, name FROM roles")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make(map[string]int)
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		ids[name] = id
	}
	return ids, rows.Err()
}

func seedUsers(ctx context.Context, tx pgx.Tx, roles map[string]int) (map[string]int64, error) {
	hash, err := auth.HashPassword("password123")
	if err != nil {
		return nil, err
	}

	users := []struct {
		key     string
		email   string
		name    string
		role    string
		balance float64
	}{
		{"buyer", "buyer@example.com", "Анна Покупатель", "user", 250000},
		{"seller", "seller@example.com", "Архивный Продавец", "user", 0},
		{"seller2", "seller2@example.com", "Винтажный Дом", "user", 0},
		{"moderator", "moderator@example.com", "Модератор", "moderator", 0},
	}

	ids := make(map[string]int64)
	for _, u := range users {
		var id int64
		err := tx.QueryRow(ctx, `
			INSERT INTO users (email, password_hash, display_name, role_id, email_verified, balance)
			VALUES ($1, $2, $3, $4, true, $5)
			ON CONFLICT (email) DO UPDATE
			SET password_hash = EXCLUDED.password_hash,
			    display_name = EXCLUDED.display_name,
			    role_id = EXCLUDED.role_id,
			    balance = GREATEST(users.balance, EXCLUDED.balance)
			RETURNING id
		`, u.email, hash, u.name, roles[u.role], u.balance).Scan(&id)
		if err != nil {
			return nil, err
		}
		ids[u.key] = id
	}
	return ids, nil
}

func seedListings(ctx context.Context, tx pgx.Tx, buyerID, sellerID, seller2ID int64) error {
	categoryIDs, err := lookup(ctx, tx, "categories")
	if err != nil {
		return err
	}
	brandIDs, err := lookup(ctx, tx, "brands")
	if err != nil {
		return err
	}

	for i, d := range demoListings {
		owner := sellerID
		if i%3 == 2 {
			owner = seller2ID
		}

		var listingID int64
		err := tx.QueryRow(ctx, "SELECT id FROM listings WHERE title = $1 AND seller_id = $2", d.Title, owner).Scan(&listingID)
		if err == nil {
			continue
		}
		if err != pgx.ErrNoRows {
			return err
		}

		err = tx.QueryRow(ctx, `
			INSERT INTO listings (
				seller_id, title, description, price, category_id, brand_id,
				size, color, condition, sale_type, status, published_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', now())
			RETURNING id
		`,
			owner, d.Title, d.Description, d.Price,
			categoryIDs[d.Category], brandIDs[d.Brand],
			d.Size, d.Color, d.Condition, d.SaleType,
		).Scan(&listingID)
		if err != nil {
			return err
		}

		for pos := 0; pos < 3; pos++ {
			url := fmt.Sprintf("https://picsum.photos/seed/%s-%d/900/1200", d.ImageSeed, pos)
			if _, err := tx.Exec(ctx, `
				INSERT INTO listing_images (listing_id, storage_key, position)
				VALUES ($1, $2, $3)
			`, listingID, url, pos); err != nil {
				return err
			}
		}

		if d.SaleType == "auction" {
			var auctionID int64
			err = tx.QueryRow(ctx, `
				INSERT INTO auctions (
					listing_id, start_price, current_price, minimum_bid_increment,
					start_at, end_at, status
				) VALUES ($1, $2, $2, 500, now() - interval '2 hours', now() + interval '2 days', 'active')
				ON CONFLICT (listing_id) DO NOTHING
				RETURNING id
			`, listingID, d.Price).Scan(&auctionID)
			if err == pgx.ErrNoRows {
				continue
			}
			if err != nil {
				return err
			}

			bidAmount := d.Price + 500
			_, err = tx.Exec(ctx, `
				INSERT INTO bids (auction_id, bidder_id, amount, idempotency_key)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (idempotency_key) DO NOTHING
			`, auctionID, buyerID, bidAmount, fmt.Sprintf("seed-bid-%d", auctionID))
			if err != nil {
				return err
			}
			if _, err := tx.Exec(ctx, `
				UPDATE auctions
				SET current_price = $1, leader_id = $2, bids_count = 1
				WHERE id = $3
			`, bidAmount, buyerID, auctionID); err != nil {
				return err
			}
		}
	}
	return nil
}

func lookup(ctx context.Context, tx pgx.Tx, table string) (map[string]int, error) {
	rows, err := tx.Query(ctx, "SELECT id, name FROM "+table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		result[name] = id
	}
	return result, rows.Err()
}
