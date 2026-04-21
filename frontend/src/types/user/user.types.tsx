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
  expiry?: string;            
  created_at: string;         
  updated_at: string;        
};

export type LoginResponse = {
  message: string;
  token: string;
};
