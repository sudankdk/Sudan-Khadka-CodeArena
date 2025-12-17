package repo

import (
	"errors"

	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepo interface {
	CreateUser(user domain.User) (domain.User, error)
	FindUser(email string) (domain.User, error)
	FindUserById(id uint) (domain.User, error)
	UpdateUser(id uint, user domain.User) (domain.User, error)
	ListUser()([]domain.User,error)
}


type userRepo struct {
	db *gorm.DB
}

func (u *userRepo) CreateUser(user domain.User) (domain.User, error) {
	if err := u.db.Create(&user).Error; err != nil {
		return domain.User{}, errors.New("error in createing new user")
	}
	return user, nil
}

func (u *userRepo) FindUser(email string) (domain.User, error) {
	var user domain.User
	if err := u.db.Where("email=?", email).First(&user).Error; err != nil {
		return domain.User{}, errors.New("error in finding users")
	}
	return user, nil
}

func (u *userRepo) FindUserById(id uint) (domain.User, error) {
	var user domain.User
	if err := u.db.Where("id=?", id).First(&user).Error; err != nil {
		return domain.User{}, errors.New("user not found")
	}
	return user, nil
}

func (u *userRepo) UpdateUser(id uint, user domain.User) (domain.User, error) {
	var existingUser domain.User
	if err := u.db.Model(&existingUser).Where("id=?", id).Clauses(clause.Returning{}).Updates(user).Error; err != nil {
		return domain.User{}, errors.New("failed to update user")
	}
	return existingUser, nil
}

func (u *userRepo) ListUser() ([]domain.User, error) {
	var users []domain.User
	if err := u.db.Find(&users).Error; err != nil {
		return []domain.User{}, errors.New("failed to list user")
	}
	return users, nil
}

func NewUserRepo(db *gorm.DB) UserRepo {
	return &userRepo{
		db: db,
	}
}
