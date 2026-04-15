package dto

type UserRegister struct {
	Username string `json:"username" validate:"required,min=3,max=30"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type UserLogin struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AdminCreateUser struct {
	Username string `json:"username" validate:"required,min=3,max=30"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Role     string `json:"role" validate:"oneof=admin regular"`
}

type UserUpdate struct {
	Username           *string  `json:"username"`
	Email              *string  `json:"email"`
	Password           *string  `json:"password"`
	Role               *string  `json:"role"`
	Rating             *float64 `json:"rating"`
	MatchesPlayed      *int     `json:"matches_played"`
	MatchesWon         *int     `json:"matches_won"`
	SubmissionsCount   *int     `json:"submissions_count"`
	SolvedCount        *int     `json:"solved_count"`
	Bio                *string  `json:"bio"`
	LanguagePreference *string  `json:"language_preference"`
	ProfileImage       *string  `json:"profile_image"`
}

type UserProfileUpdate struct {
	Username           *string `json:"username"`
	Email              *string `json:"email"`
	Password           *string `json:"password"`
	Bio                *string `json:"bio"`
	LanguagePreference *string `json:"language_preference"`
	ProfileImage       *string `json:"profile_image"`
}

type UserStats struct {
	TotalUsers      int     `json:"total_users"`
	AdminUsers      int     `json:"admin_users"`
	RegularUsers    int     `json:"regular_users"`
	AverageRating   float64 `json:"average_rating"`
	TotalMatches    int     `json:"total_matches"`
	TotalWins       int     `json:"total_wins"`
	TotalSolved     int     `json:"total_solved"`
	ActiveThisMonth int     `json:"active_this_month"`
}
