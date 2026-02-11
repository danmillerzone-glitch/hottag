// Uses Twemoji CDN images for consistent flag rendering across all browsers
// Chrome on Windows doesn't render flag emojis natively

function emojiToTwemojiUrl(emoji: string): string {
  // Convert emoji to its code point(s) for Twemoji URL
  const codePoints = Array.from(emoji)
    .map(char => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-')
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints}.svg`
}

export default function FlagEmoji({
  emoji,
  size = 24,
  title,
  className = '',
}: {
  emoji: string
  size?: number
  title?: string
  className?: string
}) {
  return (
    <img
      src={emojiToTwemojiUrl(emoji)}
      alt={emoji}
      title={title}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}
