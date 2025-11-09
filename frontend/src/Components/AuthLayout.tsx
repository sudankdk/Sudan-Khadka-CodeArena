import React from "react";
import type { AuthLayoutProp } from "../Interfaces/auth/auth";



const AuthLayout: React.FC<AuthLayoutProp> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-amber-50">
      <div className="w-3/5 bg-indigo-900 p-8 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg">Please login to your account to continue.</p>
        </div>
      </div>

      {/* Right side */}
      <div className="w-2/5 p-8 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
