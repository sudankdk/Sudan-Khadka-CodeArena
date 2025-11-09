
export interface IAuth{
    loading : boolean | null;
    token : string | null;
    setLoading: (loading: boolean) => void,
    setToken: (token: string | null) => void
}

export interface IUserRegister {
  username: string; 
  email: string;    
  password: string; 
}

export interface IUserLogin {
  email: string;
  password: string;
}