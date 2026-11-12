import type { SVGProps } from "react";

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const IconGrid = () => (
  <Base>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Base>
);

export const IconAlert = () => (
  <Base>
    <path d="M12 3 2.5 20h19L12 3z" />
    <path d="M12 10v5" />
    <path d="M12 18h.01" />
  </Base>
);

export const IconMap = () => (
  <Base>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </Base>
);

export const IconChart = () => (
  <Base>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-8" />
    <path d="M3 20h18" />
  </Base>
);

export const IconUser = () => (
  <Base>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </Base>
);

export const IconSearch = () => (
  <Base width="18" height="18">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const IconBell = () => (
  <Base>
    <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
    <path d="M10 21h4" />
  </Base>
);

export const IconLogout = () => (
  <Base width="18" height="18">
    <path d="M9 21H5V3h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Base>
);

export const Logo = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 3l17 9.5v23L24 45 7 35.5v-23L24 3z" fill="#1f9d8a" />
    <path d="M17 17l14 14M31 17L17 31" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
  </svg>
);
export const IconPin = () => (
  <Base width="14" height="14">
    <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);

export const IconChevron = () => (
  <Base width="18" height="18">
    <path d="m9 6 6 6-6 6" />
  </Base>
);