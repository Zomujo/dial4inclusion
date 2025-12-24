"use client";

import { useEffect, useRef } from "react";
import type { ApiUser } from "@/lib/api";

interface ProfileMenuProps {
  currentUser: ApiUser;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export function ProfileMenu({
  currentUser,
  profileMenuOpen,
  setProfileMenuOpen,
  onRefresh,
  onLogout,
  isLoading,
}: ProfileMenuProps) {
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setProfileMenuOpen]);

  return (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={profileMenuOpen}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {currentUser.fullName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden text-left text-xs leading-tight text-gray-600 sm:block">
          {currentUser.fullName}
        </span>
      </button>
      {profileMenuOpen && (
        <div className="absolute right-0 z-10 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl">
          <p className="font-semibold text-gray-900">{currentUser.fullName}</p>
          <p className="text-xs text-gray-600">{currentUser.email}</p>
          <p className="text-xs capitalize text-gray-500">
            Role: {currentUser.role}
          </p>
          <button
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => {
              onRefresh();
              setProfileMenuOpen(false);
            }}
            disabled={isLoading}
          >
            {isLoading ? "Syncing…" : "Sync latest"}
          </button>
          <button
            className="mt-2 w-full rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

