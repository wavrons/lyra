const RefreshIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
  </svg>
);

interface RefreshBannerProps {
  visible: boolean;
  onRefresh: () => void;
}

export function RefreshBanner({ visible, onRefresh }: RefreshBannerProps) {
  if (!visible) return null;

  return (
    <div className="refresh-banner">
      <div className="refresh-banner__content">
        <RefreshIcon className="h-4 w-4 refresh-banner__icon" />
        <span>A collaborator made changes.</span>
        <button className="refresh-banner__btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </div>
  );
}
