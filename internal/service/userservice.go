package service

import (
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
)

type UserService struct {
	Repo repo.UserRepo
}

func (u *UserService) Register(dto dto.UserRegister) (domain.User, error) {
	return domain.User{}, nil
}

func (u *UserService) Login(dto dto.UserLogin) (string, error) {
	return "", nil
}

func (u *UserService) VerifyCode(code string, id uint) error {
	return nil
}
