import { useState } from 'react';
import { CATEGORY_META } from '../lib/constants';

/**
 * Product image with an automatic gradient+emoji fallback
 * (used when the image is missing or fails to load).
 */
export default function ProductImage({ product, className = '', emojiClass = 'text-5xl' }) {
  const [failed, setFailed] = useState(false);
  const meta = CATEGORY_META[product?.category] || {
    emoji: '🛒',
    gradient: 'from-navy-300 to-lavender-400',
  };

  if (!product?.image || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${meta.gradient} ${className}`}
        aria-label={product?.name || 'Product image'}
      >
        <span className={emojiClass}>{meta.emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
