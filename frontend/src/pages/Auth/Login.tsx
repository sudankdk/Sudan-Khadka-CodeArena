import AuthLayout from '../../Components/AuthLayout';

const Login = () => {
  return (
    <AuthLayout children={<LoginForm />} >
        
    </AuthLayout>
  )
}

export default Login

const LoginForm = () => (
  <form className="flex flex-col gap-4 w-full max-w-sm">
    <input
      type="email"
      placeholder="Email"
      className="border p-2 rounded"
    />
    <input
      type="password"
      placeholder="Password"
      className="border p-2 rounded"
    />
    <button
      type="submit"
      className="bg-indigo-900 text-white p-2 rounded"
    >
      Login
    </button>
  </form>
);