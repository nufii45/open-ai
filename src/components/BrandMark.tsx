const HEALTHBRIDGE_H_PATH = 'M8 4H20V22H38V4H50V54H38V35H20V54H8Z';

/**
 * A dependency-free brand mark. Keeping this as plain SVG avoids shipping a
 * browser-only animation plugin (and keeps the mark available during builds).
 */
export function BrandMark() {
  return (
    <svg aria-hidden="true" className="size-5 text-white" viewBox="0 0 58 58" focusable="false">
      <path d={HEALTHBRIDGE_H_PATH} fill="currentColor" />
    </svg>
  );
}
