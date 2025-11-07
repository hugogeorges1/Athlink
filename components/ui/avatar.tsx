import * as React from 'react'

export function Avatar({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) {
  return (
    <img
      src={src || '/avatar-placeholder.png'}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-full object-cover border border-gray-200"
    />
  )
}
