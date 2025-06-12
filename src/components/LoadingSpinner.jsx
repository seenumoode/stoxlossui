import React from "react";

const LoadingSpinner = ({ size = 40, color = "#4facfe", className = "" }) => {
  return (
    <div
      className={`loading-spinner ${className}`}
      style={{ width: size, height: size }}
    >
      <style jsx>{`
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-top: 4px solid ${color};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
