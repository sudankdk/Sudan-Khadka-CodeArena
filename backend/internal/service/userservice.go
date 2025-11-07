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
	if dto.Email == "" || dto.Password == "" {
		return "", errors.New("fill all the required fields")
	}
	user, err := u.Repo.FindUser(dto.Email)
	if err != nil {
		return "", err
	}
	if !u.Auth.VerifyHash(dto.Password, user.Password) {
		return "", errors.New("incorrect username or password")
	}
	token, err := u.Auth.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (u *UserService) VerifyCode(code string, id uint) error {
	return nil
}
