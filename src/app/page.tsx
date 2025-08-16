import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-300">
      <h1 className="md:text-3xl text-lg font-bold">
        Welcome to Admin Dashboard👏
      </h1>
      <h2 className="md:text-2xl text-lg font-semibold mt-2 text-purple-700">
        MK Web
      </h2>
      <Link href="/admin" className="mt-4">
        <button className="mt-2 md:mt-4 px-2 md:px-4 py-2 bg-blue-500 font-semibold md:font-bold text-white rounded cursor-pointer">
          Go to Login Page
        </button>
      </Link>
    </div>
  );
}
