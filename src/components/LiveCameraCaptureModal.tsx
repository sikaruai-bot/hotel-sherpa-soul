"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle, AlertCircle, FlipHorizontal } from 'lucide-react';

interface LiveCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoUrl: string) => void;
  guestName?: string;
  title?: string;
}

export default function LiveCameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  guestName = 'Guest',
  title = 'Live Camera Photo Capture (प्रत्यक्ष फोटो खिच्नुहोस्)',
}: LiveCameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  // Start webcam stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setCameraLoading(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Please use a modern browser with webcam permissions enabled.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play caught:', e));
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.error('Webcam access error:', err);
      setCameraLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('क्यामेरा अनुमति अस्वीकृत भयो (Camera Permission Denied). कृपया ब्राउजरको सेटिङबाट क्यामेरा अन गर्नुहोस्।');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('क्यामेरा फेला परेन (No Camera Device Found). कृपया ल्यापटपको वेबक्याम वा मोबाइल क्यामेरा जडान भएको सुनिश्चित गर्नुहोस्।');
      } else {
        setCameraError(err.message || 'Failed to start camera.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    if (facingMode === 'user') {
      // Mirror user camera for natural look
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get high-quality JPEG Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (!streamRef.current) {
      startCamera(facingMode);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!capturedImage) return;

    setIsUploading(true);

    try {
      // Convert DataURL to Blob for upload
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `guest-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      // Attempt upload to /api/upload
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data?.url) {
          onCapture(uploadData.data.url);
          stopCamera();
          onClose();
          return;
        }
      }

      // If server upload had any issue, fallback seamlessly to high-res data URL
      onCapture(capturedImage);
      stopCamera();
      onClose();
    } catch (e) {
      console.warn('Upload fallback to data URL:', e);
      onCapture(capturedImage);
      stopCamera();
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">अतिथि: <span className="text-purple-300 font-semibold">{guestName}</span></p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewport / Captured Preview */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <AlertCircle size={40} className="text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-300">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-2 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700"
              >
                <RefreshCw size={14} /> पुन: प्रयास गर्नुहोस् (Try Again)
              </button>
            </div>
          ) : capturedImage ? (
            /* Captured Snapshot Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured Guest Snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                <CheckCircle size={14} /> फोटो खिचियो (Snapshot Captured)
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Target Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-72 border-2 border-dashed border-white/40 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Guest Face / ID
                  </div>
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400"></div>
                </div>
              </div>

              {/* Camera Controls Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Switch Camera (Front/Back)"
                  className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-xl backdrop-blur-xs border border-white/20 transition flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FlipHorizontal size={16} />
                  <span className="hidden sm:inline">Flip Camera</span>
                </button>

                <div className="bg-black/60 px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Feed
                </div>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
              >
                <RefreshCw size={16} /> फेरि खिच्नुहोस् (Retake)
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={isUploading}
                className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    बचत हुँदैछ...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    फोटो स्वीकृत गर्नुहोस् (Confirm & Save)
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                रद्द गर्नुहोस् (Cancel)
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={cameraLoading || Boolean(cameraError)}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-purple-950/50 disabled:opacity-50 cursor-pointer"
              >
                <Camera size={18} />
                फोटो खिच्नुहोस् (Capture Snapshot)
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
