package service

import (
	"errors"
	"fmt"

	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/repo"
)

type UserService struct {
	Repo   repo.UserRepo
	Auth   helper.Auth
	Config configs.AppConfigs
}

func (u *UserService) Register(dto dto.UserRegister) (domain.User, error) {
	if dto.Email == "" || dto.Password == "" {
		return domain.User{}, errors.New("required fields cannot be empty")
	}
	hashedPassword, err := u.Auth.CreateHash(dto.Password)
	if err != nil {
		return domain.User{}, fmt.Errorf("error in creating hash: %d", err)
	}
	user := domain.User{
		Email:    dto.Email,
		Username: dto.Username,
		Password: hashedPassword,
	}
	newUser, err := u.Repo.CreateUser(user)
	if err != nil {
		return domain.User{}, fmt.Errorf("error in creating user")
	}

	return newUser, nil
}

func (u *UserService) Login(dto dto.UserLogin) (string, error) {
	return "", nil
}

func (u *UserService) VerifyCode(code string, id uint) error {
	return nil
}
