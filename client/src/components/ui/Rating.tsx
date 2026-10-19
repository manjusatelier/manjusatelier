import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
  showZeroCount?: boolean;
}

/**
 * Calculates fill percentage (0, 50, or 100) for a given star (1..5)
 * matching Amazon's rating representation:
 * - Difference >= 0.75: Full Star (100%)
 * - Difference between 0.25 and 0.75: Half Star (50%)
 * - Difference < 0.25: Empty Star (0%)
 */
export function getStarFillPercentage(starIndex: number, rating: number): number {
  const diff = rating - (starIndex - 1);
  if (diff <= 0.2) return 0;
  if (diff >= 0.75) return 100;
  return 50; // Half-filled star for ratings with fractional ~0.5 (e.g. 4.3 - 4.7)
}

export function Rating({
  value,
  count,
  size = 14,
  className,
  showZeroCount = false,
}: RatingProps) {
  const validRating = Math.max(0, Math.min(5, Number(value) || 0));
  if (!showZeroCount && (count === 0 || (count === undefined && validRating === 0))) {
    return null;
  }

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rated ${validRating.toFixed(1)} out of 5`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = getStarFillPercentage(i, validRating);
          return (
            <div
              key={i}
              className="relative inline-flex items-center justify-center shrink-0"
              style={{ width: size, height: size }}
            >
              {/* Empty background star */}
              <Star
                size={size}
                className="text-brown/25 dark:text-beige/30 shrink-0"
              />

              {/* Filled foreground star clipped to fill percentage */}
              {fill > 0 && (
                <div
                  className="absolute left-0 top-0 overflow-hidden flex items-center"
                  style={{ width: `${fill}%`, height: size }}
                >
                  <Star
                    size={size}
                    className="fill-gold text-gold shrink-0"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-brown/60 dark:text-beige/60">({count})</span>
      )}
    </div>
  );
}

