import React, { useState } from 'react';

interface BrandLogoProps {
  logoUrl?: string;
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  size = 28,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && logoUrl.trim().length > 0 && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt="Tanvir's Science Square Logo"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        style={{ width: size, height: size }}
        className={`rounded-lg object-cover border border-emerald-500/30 shrink-0 ${className}`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {/* Clean geometric square frame representing "Science Square" */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        className="fill-emerald-600/10 stroke-emerald-600 dark:fill-emerald-500/15 dark:stroke-emerald-400"
        strokeWidth="1.75"
      />
      {/* Benzene / molecular hexagon ring */}
      <polygon
        points="16,6.5 23.5,10.8 23.5,19.4 16,23.7 8.5,19.4 8.5,10.8"
        className="stroke-teal-600/70 dark:stroke-teal-300/60"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      {/* Stylized Science Monogram "T" with electron apex */}
      <path
        d="M11.5 11.5H20.5M16 11.5V21"
        className="stroke-emerald-700 dark:stroke-emerald-300"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle
        cx="22.5"
        cy="9.5"
        r="1.7"
        className="fill-emerald-600 dark:fill-emerald-400"
      />
    </svg>
  );
};
