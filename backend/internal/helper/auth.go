package helper

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type Auth struct {
	Secret string
}

func SetupAuth(s string) *Auth {
	return &Auth{
		Secret: s,
	}
}

func (a Auth) CreateHash(p string) (string, error) {
	if len(p) < 6 {
		return "", errors.New("Password must be more than 6 characters.")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(p), 10)
	if err != nil {
		return "", errors.New("error in generating hash")
	}
	return string(hashedPassword), nil
}

func (a Auth) VerifyHash(p, hp string) bool {
	if err := bcrypt.CompareHashAndPassword([]byte(hp), []byte(p)); err != nil {
		return false
	}
	return true
}

func (a Auth) GenerateToken(id uuid.UUID, email, role string) (string, error) {
	if id == uuid.Nil || email == "" || role == "" {
		return "", errors.New("required fields cannot be empty")
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":          id,
		"email":       email,
		"role":        role,
		"expiry_date": time.Now().Add(24 * 30 * time.Hour).Unix(),
	})
	signedToken, err := token.SignedString([]byte(a.Secret))
	if err != nil {
		return "", fmt.Errorf("error in signing token :%d", signedToken)
	}
	return signedToken, nil
}

func (a Auth) VerifyToken(token string) (domain.User, error) {
	splitToken := strings.Split(token, " ")
	if len(splitToken) != 2 {
		return domain.User{}, errors.New("bearer missing or invalid token")
	}
	keyWord := splitToken[0]
	if keyWord != "Bearer" {
		return domain.User{}, errors.New("Bearer Missing")
	}
	parsedToken, err := jwt.Parse(splitToken[1], func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return domain.User{}, fmt.Errorf("Invalid signing method")
		}
		return []byte(a.Secret), nil
	})
	if err != nil {
		return domain.User{}, err
	}
	if claims, ok := parsedToken.Claims.(jwt.MapClaims); ok && parsedToken.Valid {
		expiryDate, ok := claims["expiry_date"].(float64)
		if !ok {
			return domain.User{}, errors.New("invalid expiry date type")

		}
		if time.Now().Unix() > int64(expiryDate) {
			return domain.User{}, errors.New("token is expired")
		}
		user := domain.User{}
		if email, ok := claims["email"].(string); ok {
			user.Email = email
		}
		if role, ok := claims["role"].(string); ok {
			user.Role = role
		}
		switch v := claims["id"].(type) {
		case string:
			uid, err := uuid.Parse(v)
			if err != nil {
				return domain.User{}, errors.New("invalid id format")
			}
			user.ID = uid
		case uuid.UUID:
			user.ID = v
		default:
			return domain.User{}, errors.New("invalid id type")
		}
		return user, nil
	}
	return domain.User{}, nil
}

func (a Auth) Authorize(ctx *fiber.Ctx) error {
	token := ctx.Cookies("token")
	 if token == "" {
        return ctx.Status(401).JSON(fiber.Map{"message": "Unauthorized"})
    }
	user, err := a.VerifyToken("Bearer "+token)
	if err != nil {
		return ctx.Status(401).JSON(&fiber.Map{
			"message": "Authorization Failed",
			"reason":  err,
		})
	}
	ctx.Locals("user", user)
	return ctx.Next()
}

func (a Auth) CurrentUserInfo(ctx *fiber.Ctx) (domain.User, error) {
	user := ctx.Locals("user")
	fmt.Println(user)
	return user.(domain.User), nil
}


func (a Auth) CreateCookie(ctx *fiber.Ctx, name, value string) {
    cookie := &fiber.Cookie{
        Name:     name,
        Value:    value,
        HTTPOnly: true,
        Secure:   false,
        SameSite: "Lax",  
        Path:     "/",
        MaxAge:   3600, 
    }

    ctx.Cookie(cookie)
}
