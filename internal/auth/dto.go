package auth

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserDTO struct {
	ID            int64  `json:"id"`
	Email         string `json:"email"`
	DisplayName   string `json:"display_name"`
	EmailVerified bool   `json:"email_verified"`
	Balance       string `json:"balance"`
}

type AuthResponse struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}

func ToUserDTO(u *User) UserDTO {
	return UserDTO{
		ID:            u.ID,
		Email:         u.Email,
		DisplayName:   u.DisplayName,
		EmailVerified: u.EmailVerified,
		Balance:       u.Balance,
	}
}
