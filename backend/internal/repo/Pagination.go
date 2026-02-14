package repo

import (
	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

func ApplyListQuery[T any](db *gorm.DB, query dto.ListQuery) *gorm.DB {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 {
		query.PageSize = 10
	}

	// applying filters
	for key, value := range query.Filters {
		db = db.Where(key+" = ?", value)
	}

	// applying sorting
	if query.SortBy != "" {
		order := query.SortBy + " asc"
		if query.Order == "desc" {
			order = query.SortBy + " desc"
		}
		db = db.Order(order)
	}

	offset := (query.Page - 1) * query.PageSize
	db = db.Offset(offset).Limit(query.PageSize)

	return db

}
