"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-neutral-500 hover:text-neutral-800"
    >
      {label}
    </button>
  );
}
