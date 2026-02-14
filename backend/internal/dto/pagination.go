package dto

type ListQuery struct {
	Page     int               `json:"page" form:"page"`           // page number
	PageSize int               `json:"page_size" form:"page_size"` // items per page
	SortBy   string            `json:"sort_by" form:"sort_by"`     // e.g., "created_at"
	Order    string            `json:"order" form:"order"`         // "asc" or "desc"
	Filters  map[string]string `json:"filters" form:"filters"`     // e.g., {"status": "active"}
}
