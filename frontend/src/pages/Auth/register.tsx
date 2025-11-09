import AuthLayout from '../../Components/AuthLayout';

const register = () => {

  return (
    <AuthLayout children={<RegisterForm />}></AuthLayout>
  )
}

export default register




const RegisterForm = () => (
  <form className="flex flex-col gap-4 w-full max-w-sm">
    <input
      type="email"
      placeholder="Email"
      className="border p-2 rounded"
    />
    <input 
        type="text"
        placeholder="Username"
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