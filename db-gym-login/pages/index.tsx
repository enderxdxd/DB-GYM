import { useState } from "react";
import Head from "next/head";
import PasswordInput from "../components/PasswordInput";
import { isCommonPassword } from "../utils/commonPasswords";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    const lengthValid = password.length >= 15 && password.length <= 64;
    const charsetValid = /^[A-Za-z\d@$!%*?&^#()\-_=+[\]{}|;:'",.<>/~`\\]+$/.test(password);
    const notCommon = !isCommonPassword(password);
    return lengthValid && charsetValid && notCommon;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be 15–64 characters, include valid symbols, and not be a common password.");
      return;
    }
    setError("");
    alert("Validation passed! (API call will be implemented later)");
  };

  return (
    <>
      <Head>
        <title>Sign in to DB-GYM</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-6"
        >
          <h1 className="text-2xl font-bold text-center text-blue-800">
            Sign in to DB-GYM
          </h1>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              User Name
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="you@example.com"
              required
            />
          </div>

          <PasswordInput password={password} setPassword={setPassword} />

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded"
          >
            LOGIN
          </button>

          <div className="text-center">
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
