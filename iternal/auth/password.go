package auth

import (
	"github.com/alexedwards/argon2id"
)

func HashPassword(password string) (string, error) {
	return argon2id.CreateHash(password, argon2id.DefaultParams)
}

func VerifyPassword(password, hash string) (bool, error) {
	return argon2id.ComparePasswordAndHash(password, hash)
}

func VerifyPasswordConst() error {
	_, err := argon2id.ComparePasswordAndHash("dummy", dummyHash)
	return err
}

const dummyHash = "a7543b3feb1d9fc2a7e6785a770ac55e"
