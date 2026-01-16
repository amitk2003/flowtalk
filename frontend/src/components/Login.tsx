import { useState } from "react";
import { login, register } from "@/services/authService";

export default function Login({ onAuth }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = isRegister
        ? await register(name, email, password)
        : await login(email, password);

      localStorage.setItem("token", data.token);
      onAuth(data.user, data.token);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-bold mb-4 text-center">
          {isRegister ? "Register" : "Login"}
        </h2>

        {isRegister && (
          <input
            className="w-full p-2 border mb-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className="w-full p-2 border mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 border mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-500 text-white p-2 rounded"
          onClick={handleSubmit}
        >
          {isRegister ? "Sign Up" : "Login"}
        </button>

        <p
          className="text-center text-sm mt-3 text-blue-500 cursor-pointer"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New user? Register"}
        </p>
      </div>
    </div>
  );
}
