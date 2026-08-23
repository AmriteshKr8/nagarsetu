import React from 'react';

export function Icon({ type, size = 34 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (type === "folder") return (
    <svg {...common}>
      <path d="M6 12.5C6 10.57 7.57 9 9.5 9H20l4 4h14.5c1.93 0 3.5 1.57 3.5 3.5v18c0 1.93-1.57 3.5-3.5 3.5h-29C7.57 38 6 36.43 6 34.5v-22Z" stroke="#16C98A" strokeWidth="3.2" strokeLinejoin="round"/>
    </svg>
  );

  if (type === "clock") return (
    <svg {...common}>
      <circle cx="24" cy="24" r="14" stroke="#9D55FF" strokeWidth="3.2"/>
      <path d="M24 16v9l6 3" stroke="#9D55FF" strokeWidth="3.2" strokeLinecap="round"/>
    </svg>
  );

  if (type === "check") return (
    <svg {...common}>
      <path d="m12 25 8 8 17-19" stroke="#0BBD78" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (type === "warning") return (
    <svg {...common}>
      <path d="M24 7 42 39H6L24 7Z" stroke="#F34C35" strokeWidth="3.2" strokeLinejoin="round"/>
      <path d="M24 18v10M24 33.5v.5" stroke="#F34C35" strokeWidth="3.2" strokeLinecap="round"/>
    </svg>
  );

  return null;
}

export function ShieldIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path d="M50 7 C50 7 24 14 18 20 V44 C18 66 32 84 50 91 C68 84 82 66 82 44 V20 C76 14 50 7 50 7Z" fill="#000000" />
      <circle cx="50" cy="39" r="12" fill="#E5ECEC" />
      <rect x="46.5" y="48" width="7" height="19" rx="3.5" fill="#E5ECEC" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 30 30" width="100%" height="100%">
      <rect x="6" y="12" width="18" height="14" rx="2" fill="none" stroke="#222222" strokeWidth="2.5" />
      <path d="M10 12V8 C10 5 12 3.5 15 3.5 C18 3.5 20 5 20 8V12" fill="none" stroke="#222222" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="15" cy="19" r="2" fill="#222222" />
      <rect x="14" y="19" width="2" height="4" rx="1" fill="#222222" />
    </svg>
  );
}

export function CivicIllustration() {
  return (
    <svg viewBox="0 0 600 330" width="100%" height="100%">
      <path d="M80 275 C91 170 175 93 300 93 C425 93 509 170 520 275 Z" fill="#E0E1F8" />
      <g fill="#D4D7F3">
        <rect x="93" y="204" width="34" height="71" rx="5" />
        <rect x="119" y="180" width="30" height="95" rx="5" />
        <rect x="146" y="214" width="27" height="61" rx="5" />
        <rect x="406" y="201" width="29" height="74" rx="5" />
        <rect x="433" y="185" width="31" height="90" rx="5" />
        <rect x="463" y="214" width="30" height="61" rx="5" />
        <rect x="171" y="217" width="22" height="58" rx="5" />
        <rect x="386" y="217" width="22" height="58" rx="5" />
      </g>
      <g>
        <path d="M240 166 C240 119 264 93 300 93 C336 93 360 119 360 166 Z" fill="#9C7AE8" />
        <path d="M260 160 C260 121 275 102 300 102 C325 102 340 121 340 160 Z" fill="#A986ED" />
        <rect x="296" y="58" width="8" height="37" rx="4" fill="#6640B5" />
        <path d="M303 59 C319 51 331 50 345 56 C334 66 335 76 345 84 C330 87 317 82 303 87 Z" fill="#F44336" />
        <path d="M303 59 C316 53 327 52 338 55 C328 63 329 72 338 79 C326 80 315 77 303 81 Z" fill="#FF5722" />
        <rect x="249" y="157" width="102" height="18" rx="5" fill="#B48AF0" />
        <rect x="222" y="169" width="156" height="16" rx="6" fill="#7135D9" />
        <rect x="232" y="184" width="136" height="68" fill="#E5D8FA" />
        <rect x="251" y="185" width="28" height="67" rx="6" fill="#6932C7" />
        <rect x="286" y="185" width="28" height="67" rx="6" fill="#5D2DBA" />
        <rect x="321" y="185" width="28" height="67" rx="6" fill="#6932C7" />
        <rect x="256" y="191" width="8" height="55" rx="3" fill="#7442D3" />
        <rect x="291" y="191" width="8" height="55" rx="3" fill="#7040D0" />
        <rect x="326" y="191" width="8" height="55" rx="3" fill="#7442D3" />
        <rect x="204" y="208" width="28" height="15" rx="5" fill="#7035D7" />
        <rect x="368" y="208" width="28" height="15" rx="5" fill="#7035D7" />
        <rect x="219" y="250" width="162" height="19" rx="5" fill="#DCC8F6" />
        <rect x="195" y="267" width="210" height="18" rx="6" fill="#6831CF" />
        <rect x="205" y="267" width="190" height="7" rx="3" fill="#7541D8" />
      </g>
      <g fill="#D6D8F5">
        <circle cx="75" cy="181" r="15" />
        <circle cx="92" cy="174" r="21" />
        <circle cx="112" cy="181" r="15" />
        <rect x="66" y="180" width="61" height="14" rx="7" />
      </g>
      <g fill="#D6D8F5">
        <circle cx="472" cy="101" r="18" />
        <circle cx="493" cy="92" r="27" />
        <circle cx="519" cy="102" r="18" />
        <rect x="461" y="101" width="73" height="17" rx="8" />
      </g>
      <circle cx="120" cy="119" r="11" fill="#F42D59" />
      <circle cx="80" cy="238" r="7" fill="#00C989" />
      <circle cx="548" cy="213" r="10" fill="#F9AE00" />
      <circle cx="566" cy="181" r="9" fill="#8A6BE8" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path d="M27 9L14 21L27 33" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 21H35" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ClipboardIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <rect x="7" y="6" width="20" height="24" rx="3" stroke="#1746AD" strokeWidth="2.5" />
      <rect x="12" y="3" width="10" height="6" rx="2" fill="#E9F1FF" stroke="#1746AD" strokeWidth="2.5" />
      <path d="M12 15H22" stroke="#1746AD" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 20H22" stroke="#1746AD" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 25H18" stroke="#1746AD" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ImagePlaceholder() {
  return (
    <div className="image-placeholder" aria-label="Issue image placeholder">
      <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <rect x="7" y="8" width="40" height="36" rx="5" stroke="#8B8178" strokeWidth="3" />
        <circle cx="19" cy="20" r="4" fill="#8B8178" />
        <path d="M12 38L24 27L31 34L36 29L44 38" stroke="#8B8178" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function ChevronIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M11 6L21 16L11 26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}