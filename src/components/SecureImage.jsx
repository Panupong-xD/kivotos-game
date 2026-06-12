import React, { useState, useEffect } from 'react'

export default function SecureImage({ src, fallbackSrc = '/images/schoolicon/ETC.png', ...props }) {
  const [blobUrl, setBlobUrl] = useState('')

  useEffect(() => {
    if (!src) {
      setBlobUrl('')
      return
    }

    let active = true
    let currentUrl = ''

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (active) {
          currentUrl = URL.createObjectURL(blob)
          setBlobUrl(currentUrl)
        }
      })
      .catch((err) => {
        console.warn('Failed to load secure image:', src, err)
        if (active) {
          setBlobUrl(fallbackSrc)
        }
      })

    return () => {
      active = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [src, fallbackSrc])

  return <img src={blobUrl || fallbackSrc} {...props} />
}
