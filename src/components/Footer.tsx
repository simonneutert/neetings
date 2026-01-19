import { MarketingInfo } from "./MarketingInfo";

interface FooterProps {
  onTermsClick?: () => void;
  onImprintClick?: () => void;
}

export function Footer({ onTermsClick, onImprintClick }: FooterProps) {
  return (
    <footer class="mt-5 pt-5 pb-5 border-top bg-body-secondary text-muted text-center">
      <div class="container">
        <MarketingInfo
          variant="footer"
          onTermsClick={onTermsClick}
          onImprintClick={onImprintClick}
        />
      </div>
    </footer>
  );
}
