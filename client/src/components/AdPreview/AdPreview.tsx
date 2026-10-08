import type { AdCreative } from '@shared/types';
import './AdPreview.scss';

interface AdPreviewProps {
  businessName: string;
  product: string;
  creative: AdCreative;
}

/** How the ad will look in a generic social feed, updating as the copy is edited. */
export default function AdPreview({ businessName, product, creative }: AdPreviewProps) {
  const name = businessName.trim() || 'Your business';
  const initial = name.charAt(0).toUpperCase();

  return (
    <figure className="ad-preview" aria-label="Ad preview">
      <div className="ad-preview__card">
        <div className="ad-preview__head">
          <span className="ad-preview__avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="ad-preview__who">
            <span className="ad-preview__name">{name}</span>
            <span className="ad-preview__sponsored">Sponsored</span>
          </span>
        </div>

        <p className="ad-preview__body">{creative.body || 'Your ad text appears here.'}</p>

        <div className="ad-preview__media" aria-hidden="true">
          <span className="ad-preview__media-text">{product.trim() || 'Your product'}</span>
        </div>

        <div className="ad-preview__foot">
          <span className="ad-preview__headline">{creative.headline || 'Your headline'}</span>
          <span className="ad-preview__cta">{creative.cta || 'Learn more'}</span>
        </div>
      </div>
      <figcaption className="ad-preview__caption">Preview in a social feed</figcaption>
    </figure>
  );
}
