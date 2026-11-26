import React, { useState } from 'react';
import { LogOut, UserCheck, ChevronDown } from 'lucide-react';
import { UserProfile, ViewRoute } from '../types/lms';
import { isVerifiedAdminUser } from '../utils/authGuards';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentView: ViewRoute;
  onNavigate: (view: ViewRoute) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  theme,
  onToggleTheme,
  logoUrl,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = (active: boolean) =>
    `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
      active
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 dark:border-emerald-900/80 dark:bg-[#030805]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1 py-0.5 min-w-0"
        >
          <BrandLogo logoUrl={logoUrl} size={26} />
          <span className="font-display text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-[155px] sm:max-w-none">
            Tanvir&apos;s Science Square
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className={navLinkClass(currentView === 'catalog')}
          >
            Catalog
            {currentView === 'catalog' && (
              <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-emerald-600 dark:bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('student')}
            className={navLinkClass(currentView === 'student')}
          >
            My Learning
            {currentView === 'student' && (
              <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-emerald-600 dark:bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('classroom')}
            className={navLinkClass(currentView === 'classroom')}
          >
            Classroom
            {currentView === 'classroom' && (
              <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-emerald-600 dark:bg-emerald-400" />
            )}
          </button>

          {isVerifiedAdminUser(currentUser) && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={navLinkClass(currentView === 'admin')}
            >
              Admin Console
              {currentView === 'admin' && (
                <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-emerald-600 dark:bg-emerald-400" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: 3D Theme Toggle + Primary User Action (Desktop & Mobile) */}
        <div className="relative flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-emerald-900/80 dark:bg-[#04140a] px-2.5 sm:px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 hover:border-emerald-500/60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600/10 dark:bg-emerald-500/15 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {currentUser.initials}
                </span>
                <span className="max-w-[80px] sm:max-w-[110px] truncate">{currentUser.name}</span>
                <span className="text-xs text-teal-700 dark:text-teal-300 font-normal hidden sm:inline">
                  · {currentUser.role === 'admin' ? 'Admin' : 'Student'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#031109] p-1.5 shadow-xl">
                    <div className="border-b border-slate-200 dark:border-emerald-900/60 px-3 py-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAuth();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#04140a] hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300 shrink-0" />
                      <span>Account &amp; Role Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#04140a] hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
