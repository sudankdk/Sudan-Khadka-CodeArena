export type User = {
  id: string;
  username: string;
  email: string;
  password?: string;          // omitted in responses
  bio?: string;
  profile_image?: string;
  rank: number;
  rating: number;
  matches_played: number;
  matches_won: number;
  submissions_count: number;
  language_preference: string;
  role: string;
  code?: string;
  expiry?: string;            // ISO timestamp
  created_at: string;         // ISO timestamp
  updated_at: string;         // ISO timestamp
};

export type LoginResponse = {
  message: string;
  token: string;
};
