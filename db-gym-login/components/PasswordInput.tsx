import { useState } from "react";

type Props = {
  password: string;
  setPassword: (value: string) => void;
};

export default function PasswordInput({ password, setPassword }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Password
      </label>
      <div className="relative mt-1">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-gray-900"
          placeholder="Enter your password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 px-3 text-sm text-blue-600 hover:underline focus:outline-none"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}