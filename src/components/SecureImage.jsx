import React, { useState, useEffect } from 'react'

export default function SecureImage({ 
  src, 
  fallbackSrc = '/images/schoolicon/ETC.png', 
  isSilhouette = false, 
  blurPx = '0px', 
  ...props 
}) {
  const [blobUrl, setBlobUrl] = useState('')

  useEffect(() => {
    if (!src) {
      setBlobUrl('')
      return
    }

    let active = true
    let currentUrl = ''

    // Fetch the image as a blob
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        // If no silhouette and no blur is requested, return original blob url
        if (!isSilhouette && (!blurPx || blurPx === '0px')) {
          if (active) {
            currentUrl = URL.createObjectURL(blob)
            setBlobUrl(currentUrl)
          }
          return
        }

        // Load image onto offscreen canvas to apply filters securely
        const img = new Image()
        const objectUrl = URL.createObjectURL(blob)
        img.src = objectUrl

        img.onload = () => {
          if (!active) {
            URL.revokeObjectURL(objectUrl)
            return
          }

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height

          // Apply blur filter on canvas securely by downscaling/upscaling
          // This is 100% compatible with all browsers (including Safari) and discards high-res details
          const blurVal = parseFloat(blurPx) || 0
          if (blurVal > 0) {
            let divisor = 1
            if (blurVal >= 25) divisor = 16
            else if (blurVal >= 15) divisor = 10
            else if (blurVal >= 8) divisor = 6
            else if (blurVal >= 3) divisor = 3

            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = Math.max(1, Math.round(canvas.width / divisor))
            tempCanvas.height = Math.max(1, Math.round(canvas.height / divisor))
            const tempCtx = tempCanvas.getContext('2d')

            // Draw scaled down
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)

            // Draw scaled up back to original canvas
            ctx.imageSmoothingEnabled = true
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height)
          } else {
            // Draw normally
            ctx.drawImage(img, 0, 0)
          }

          // If silhouette (blackout) is active, fill image pixels with dark color
          if (isSilhouette) {
            ctx.globalCompositeOperation = 'source-in'
            ctx.fillStyle = '#090a0f' // Very dark gray/black matching the theme
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          canvas.toBlob((processedBlob) => {
            URL.revokeObjectURL(objectUrl)

            if (active && processedBlob) {
              currentUrl = URL.createObjectURL(processedBlob)
              setBlobUrl(currentUrl)
            }
          }, 'image/webp')
        }

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          if (active) {
            setBlobUrl(fallbackSrc)
          }
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
  }, [src, fallbackSrc, isSilhouette, blurPx])

  return <img src={blobUrl || fallbackSrc} {...props} />
}
