import { Route,Routes } from "react-router-dom"
import Register from "./pages/Auth/register"
import Login from "./pages/Auth/Login"

function App() {

  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  )
}

export default App
