"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // State for error message

    const router = useRouter();

    const handler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (email === "mahad@gmail.com" && password === "mahad000") {
            localStorage.setItem("isLoggedIn", "true");
            setError(""); // clear error
            router.push("/admin/dashboard00");
        } else {
            setError("Email & Password is not correct !");
        }
    };

    return (
        <form onSubmit={handler} className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-4 text-center">Admin Login</h2>
                
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full p-2 border border-gray-300 rounded mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                <button
                    type="submit"
                    className="w-full bg-blue-600 mt-4 text-white p-2 rounded hover:bg-blue-700 transition"
                >
                    Login
                </button>
            </div>
        </form>
    );
}
