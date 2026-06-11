import React from 'react'

export default function LoadingScreen({ fadeLoading, text = "กำลังโหลดข้อมูลนักเรียน SCHALE..." }) {
  return (
    <div className={`ba-loading-screen ${!fadeLoading ? 'fade-out' : ''}`}>
      <div className="ba-loading-halo-wrapper">
        <div className="ba-loading-ring outer"></div>
        <div className="ba-loading-ring inner"></div>
        <div className="ba-loading-logo">
          <img 
            src="/images/icon/icon_x512.png" 
            alt="SCHALE Logo" 
            className="ba-loading-logo-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/schoolicon/ETC.png';
            }} 
          />
        </div>
      </div>
      <p className="ba-loading-text">{text}</p>
      <div className="ba-loading-progress-bar">
        <div className="ba-loading-progress-fill"></div>
      </div>
    </div>
  )
}
