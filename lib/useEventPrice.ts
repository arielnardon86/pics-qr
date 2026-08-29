'use client'

import { useEffect, useState } from 'react'

const FALLBACK_PRICE = 5000

export function useEventPrice(): number | null {
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/public/price')
      .then(res => res.json())
      .then(data => setPrice(typeof data.price === 'number' && !isNaN(data.price) ? data.price : FALLBACK_PRICE))
      .catch(() => setPrice(FALLBACK_PRICE))
  }, [])

  return price
}

export function formatPrice(price: number): string {
  return price.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}
