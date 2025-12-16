import { logo } from "@/const/Images"
import AnimatedGridBackground from "@/Components/AnimatedGridBackground"
import "@fontsource/roboto"
import { useNavigate } from "react-router-dom"

const LandingPage = () => {
const nav = useNavigate()
const handleLogin = () => {
  nav("/login")
}
  
  return (
    <div className="bg-black text-white font-mono min-h-screen relative overflow-hidden">
      <AnimatedGridBackground />

      {/* Header */}
<header className="border border-white/40 mx-10 mt-10 flex justify-between items-center ">
        <div className="text-4xl font-bold tracking-wider "><img src={logo} className="h-20"   alt="CODE ARENA" /></div>

        <button onClick={handleLogin} className="border border-white/40 px-6 mx-4 py-2 flex items-center gap-2 hover:bg-white hover:text-black transition">
          Login
          <span className="text-lg">↑</span>
        </button>
      </header>

      {/* Left Vertical Date */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 rotate-90 text-xs tracking-widest opacity-70">
        2077 · 02 · 02
      </div>

      {/* Center Title */}
      <div className="flex items-center justify-center h-[60vh]">
        <h1 className="text-7xl font-extrabold tracking-wide" style={{ fontFamily: "Roboto" }}>Code Arena</h1>
      </div>

      {/* Bottom-left Description */}
      <div className="absolute bottom-10 left-10 max-w-xs text-xs opacity-80 leading-relaxed">
        Code Arena is a lightweight, self-hosted coding platform that turns practice into progress.
        Submit code, run tests in an isolated sandbox, get instant feedback, and track your growth
        with leaderboards and replayable test cases — all without vendor lock-in.
      </div>

      {/* Bottom-right Version Card */}
      <div className="absolute bottom-10 right-10 border border-white/40 px-6 py-3 flex items-center gap-4">
        <div className="text-sm tracking-wider">VOL.04</div>
        <div className="w-24 h-6 bg-white" />
      </div>
    </div>
  )
}

export default LandingPage
