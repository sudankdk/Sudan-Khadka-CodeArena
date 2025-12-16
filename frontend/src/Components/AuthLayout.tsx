import React from "react";
import type { AuthLayoutProp } from "../Interfaces/auth/auth";
import { logo } from "@/const/Images"


const AuthLayout: React.FC<AuthLayoutProp> = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Panel: Welcome */}
      <div className="md:w-3/5 w-full bg-gradient-to-tr bg-black p-12 flex items-center justify-center text-white">
        <div className="text-center max-w-lg mx-auto">
          <img src={logo} alt="logo" />
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-wide">
            Welcome Back!
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 font-normal mb-2">
            Please login to your account to continue.
          </p>
        </div>
      </div>

      {/* Right Panel: Form/children */}
      <div className="md:w-2/5 w-full p-8 flex items-center justify-center bg-white">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;