'use client';

import React, { useEffect, useState } from 'react';

interface SuccessModalProps {
  onClose: () => void;
  listingData: {
    title: string;
    price: string;
    category: string;
  };
}

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  const randomDuration = 2 + Math.random() * 1;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${randomX}%`,
        top: '-10px',
        animation: `fall ${randomDuration}s linear forwards`,
        transformOrigin: 'center center',
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="w-2 h-2 bg-orange-500 rounded-full"
        style={{
          transform: `rotate(${randomRotation}deg)`,
        }}
      />
    </div>
  );
};

export function SuccessModal({ onClose, listingData }: SuccessModalProps) {
  const [confetti, setConfetti] = useState<number[]>([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => i * 50);
    setConfetti(pieces);

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
      @keyframes bounce-in {
        0% {
          transform: scale(0) translateY(-20px);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .modal-content {
        animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `;
    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      {/* Confetti */}
      {confetti.map((delay) => (
        <ConfettiPiece key={delay} delay={delay} />
      ))}

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="modal-content bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header Background */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-12 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-4 animate-bounce">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 className="text-3xl font-black text-white mb-2">Congratulations!</h2>
            <p className="text-white/90 text-lg font-medium">Your listing is now live</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Listing Summary */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product Title
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1 line-clamp-2">
                  {listingData.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Price
                  </p>
                  <p className="text-xl font-black text-orange-600 mt-1">
                    GHS {parseFloat(listingData.price).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Category
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {listingData.category}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center space-y-2">
              <p className="text-slate-700">
                Your product is now visible to buyers. Start getting inquiries right away!
              </p>
              <p className="text-sm text-slate-500">
                Check your email for listing confirmation and updates.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Create Another Listing
              </button>
              <button
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all"
              >
                View Dashboard
              </button>
            </div>
          </div>

          {/* Decoration */}
          <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-red-600"></div>
        </div>
      </div>
    </>
  );
}
