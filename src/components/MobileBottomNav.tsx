import React from 'react';
import { Compass, BookOpen, PlaySquare, ShieldCheck, User } from 'lucide-react';
import { UserProfile, ViewRoute } from '../types/lms';
import { isVerifiedAdminUser } from '../utils/authGuards';

interface MobileBottomNavProps {
  currentView: ViewRoute;
  onNavigate: (view: ViewRoute) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
}) => {
  const isAdmin = isVerifiedAdminUser(currentUser);

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[48px] text-[11px] font-medium transition-colors whitespace-nowrap ${
      active
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
    }`;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-slate-200 bg-white/95 dark:border-emerald-900/80 dark:bg-[#031109]/95 px-2 backdrop-blur-md md:hidden transition-colors"
    >
      <button
        type="button"
        onClick={() => onNavigate('catalog')}
        className={itemClass(currentView === 'catalog')}
      >
        <Compass className="h-4 w-4" />
        <span>Explore</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('student')}
        className={itemClass(currentView === 'student')}
      >
        <BookOpen className="h-4 w-4" />
        <span>Learning</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('classroom')}
        className={itemClass(currentView === 'classroom')}
      >
        <PlaySquare className="h-4 w-4" />
        <span>Classroom</span>
      </button>

      {isAdmin ? (
        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className={itemClass(currentView === 'admin')}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Admin</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className={itemClass(false)}
        >
          <User className="h-4 w-4" />
          <span>{currentUser ? 'Account' : 'Sign In'}</span>
        </button>
      )}
    </nav>
  );
};
