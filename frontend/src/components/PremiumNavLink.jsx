import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * PremiumNavLink
 * Enterprise navigation component with zero-layout-shift animated left-to-right underline,
 * keyboard accessibility, active state persistence, and nested route matching.
 */
export function PremiumNavLink({
  to,
  children,
  className = '',
  icon: Icon,
  exact = false,
  badge,
  onClick,
  ...rest
}) {
  const location = useLocation();

  // Determine active state, matching nested children if not exact
  const isActive = exact
    ? location.pathname === to
    : location.pathname === to || (to !== '/' && to !== '/app' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative inline-flex items-center gap-2 py-2 px-1 text-xs transition-colors duration-200 cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#153D32] dark:focus-visible:ring-[#E9A15B] focus-visible:ring-offset-2 rounded-lg ${
        isActive
          ? 'font-bold text-[#153D32] dark:text-[#E9A15B]'
          : 'font-semibold text-[#42524A] dark:text-slate-300 hover:text-[#153D32] dark:hover:text-[#E9A15B]'
      } ${className}`}
      {...rest}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 transition-colors duration-200 shrink-0 ${
            isActive
              ? 'text-[#153D32] dark:text-[#E9A15B]'
              : 'text-slate-400 group-hover:text-[#153D32] dark:group-hover:text-[#E9A15B]'
          }`}
        />
      )}
      <span>{children}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#E9A15B]/20 text-[#964208] dark:text-[#E9A15B]">
          {badge}
        </span>
      )}

      {/* Smooth Transform Underline (Zero Layout Shift, scaleX Left-to-Right) */}
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#153D32] dark:bg-[#E9A15B] origin-left motion-reduce:transition-none transition-transform duration-200 ease-out ${
          isActive
            ? 'scale-x-100'
            : 'scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100'
        }`}
      />
    </NavLink>
  );
}

/**
 * PremiumSubNavLink
 * For nested secondary dashboard tabs (pills or submenus)
 */
export function PremiumSubNavLink({ to, children, icon: Icon, exact = false, onClick }) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname === to || (to !== '/' && to !== '/app' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#153D32] dark:focus-visible:ring-[#E9A15B] ${
        isActive
          ? 'bg-[#153D32] text-white dark:bg-[#E9A15B] dark:text-[#153D32] font-bold shadow-xs'
          : 'bg-white dark:bg-white/5 text-[#42524A] dark:text-slate-300 hover:text-[#153D32] dark:hover:text-[#E9A15B] border border-[#DDE9D8] dark:border-white/10 font-semibold'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </NavLink>
  );
}

