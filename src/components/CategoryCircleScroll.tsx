import React from 'react';
import {
  LayoutGrid,
  FlaskConical,
  Atom,
  Sigma,
  Dna,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { CategoryItem } from '../types/lms';

interface CategoryCircleScrollProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  courseCounts: Record<string, number>;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'All':
      return LayoutGrid;
    case 'Chemistry':
      return FlaskConical;
    case 'Physics':
      return Atom;
    case 'Higher Math':
      return Sigma;
    case 'Biology':
      return Dna;
    case 'Admission':
      return GraduationCap;
    default:
      return Layers;
  }
};

export const CategoryCircleScroll: React.FC<CategoryCircleScrollProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  courseCounts,
}) => {
  const dockCategories = categories.slice(0, 6);

  return (
    <section aria-label="Science disciplines" className="py-1 overflow-visible">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Browse by Science Subject
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
          {dockCategories.length} subjects
        </span>
      </div>

      {/* Responsive Floating-Dock Grid: 3 per row on mobile (2 rows), 6 in 1 row on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-4 rounded-3xl bg-[#e8e4df]/70 dark:bg-[#191818]/90 shadow-lg transition-all duration-300 overflow-visible">
        {dockCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const Icon = getCategoryIcon(cat.id);
          const count = courseCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              aria-pressed={isActive}
              className="relative group flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-3 hover:scale-110 active:scale-95 focus-visible:outline-none py-1"
            >
              {/* Floating Tooltip Badge on Hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 bg-black dark:bg-white text-white dark:text-black text-[10px] font-semibold px-2 py-0.5 rounded-lg shadow whitespace-nowrap z-20 tabular-nums"
              >
                {count} {count === 1 ? 'Course' : 'Courses'}
              </span>

              {/* Circular Icon Button */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  isActive
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-[#222226] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                }`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </div>

              {/* Discipline Label & Bengali Hint / Count Below */}
              <span
                className={`text-xs sm:text-sm font-semibold mt-2 text-center line-clamp-1 transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {cat.shortLabel}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums line-clamp-1">
                {cat.bengaliHint ? `${cat.bengaliHint} · ${count}` : count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

