"use client";

import type { ApiUser } from "@/lib/api";
import { tabs } from "../utils/constants";
import { ProfileMenu } from "./ProfileMenu";

interface DashboardNavProps {
  currentUser: ApiUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  isNavigator: boolean;
  isDistrictOfficer: boolean;
  onNewCase: () => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export function DashboardNav({
  currentUser,
  activeTab,
  setActiveTab,
  isAdmin,
  isNavigator,
  isDistrictOfficer,
  onNewCase,
  profileMenuOpen,
  setProfileMenuOpen,
  onRefresh,
  onLogout,
  isLoading,
}: DashboardNavProps) {
  const visibleTabs = isAdmin ? tabs : tabs.filter((t) => t.id !== "monitoring");

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dial4Inclusion</h1>
            <p className="text-sm text-gray-600">PWD Response Dashboard</p>
          </div>
          {(isAdmin || isNavigator) && (
            <div className="flex rounded-lg bg-gray-100 p-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {(isAdmin || isNavigator) && !isDistrictOfficer && (
            <button
              onClick={onNewCase}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + New Case
            </button>
          )}
          <ProfileMenu
            currentUser={currentUser}
            profileMenuOpen={profileMenuOpen}
            setProfileMenuOpen={setProfileMenuOpen}
            onRefresh={onRefresh}
            onLogout={onLogout}
            isLoading={isLoading}
          />
        </div>
      </div>
    </nav>
  );
}

