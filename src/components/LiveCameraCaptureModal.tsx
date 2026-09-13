"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle, AlertCircle, FlipHorizontal, User, Sparkles } from 'lucide-react';

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
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [flashEffect, setFlashEffect] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Check available camera devices
  const enumerateCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }
  }, []);

  // Start webcam stream with preferred mode
  const startCamera = useCallback(
    async (mode: 'user' | 'environment', deviceId?: string) => {
      setCameraLoading(true);
      setCameraError(null);
      stopCamera();

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported in this browser. Please use a modern browser (Chrome/Safari/Edge).');
        }

        let stream: MediaStream | null = null;

        // Try primary constraints
        try {
          const videoConstraints: MediaTrackConstraints = deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: { ideal: mode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              };

          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          });
        } catch (initialErr) {
          console.warn('Initial camera constraints failed, attempting fallback...', initialErr);
          // Fallback: try basic facingMode or any available camera
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: mode },
              audio: false,
            });
          } catch (fallbackErr) {
            console.warn('Second camera fallback failed, using generic video...', fallbackErr);
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        if (!stream) {
          throw new Error('Could not establish camera stream.');
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Video auto-play warning:', playErr);
          }
        }

        // Re-enumerate to get labeled camera list once permission granted
        await enumerateCameras();
        setCameraLoading(false);
      } catch (err: any) {
        console.error('Webcam access error:', err);
        setCameraLoading(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('क्यामेरा अनुमति अस्वीकृत भयो (Camera Permission Denied). कृपया ब्राउजरको URL बारबाट Camera Allow गर्नुहोस्।');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('क्यामेरा फेला परेन (No Camera Device Found). कृपया मोबाइल वा ल्यापटपको क्यामेरा जडान भएको सुनिश्चित गर्नुहोस्।');
        } else if (err.name === 'OverconstrainedError') {
          setCameraError('यो डिभाइसमा छानिएको क्यामेरा उपलब्ध छैन। अर्को क्यामेरा (Front/Back) छान्नुहोस्।');
        } else {
          setCameraError(err.message || 'क्यामेरा सुरु गर्न सकिएन (Failed to start camera).');
        }
      }
    },
    [stopCamera, enumerateCameras]
  );

  // Switch to Front or Back camera
  const handleSelectFacingMode = (mode: 'user' | 'environment') => {
    if (mode === facingMode && !cameraError) return;
    setFacingMode(mode);
    setSelectedDeviceId('');
    startCamera(mode);
  };

  // Toggle quick flip button
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    handleSelectFacingMode(nextMode);
  };

  // Switch when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera(facingMode, selectedDeviceId || undefined);

    return () => {
      stopCamera();
    };
  }, [isOpen]); // Only run on open/close; internal state changes handle themselves

  // Take Snapshot
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Trigger visual flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image only for front (selfie) camera for natural appearance
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // High quality JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode, selectedDeviceId || undefined);
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

      // Fallback seamlessly to data URL
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">
                पाहुना: <span className="text-purple-300 font-semibold">{guestName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* FRONT & BACK CAMERA SELECTION BAR */}
        {!capturedImage && (
          <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-center">
              <Sparkles size={14} className="text-purple-400" />
              <span>क्यामेरा छान्नुहोस् (Choose Camera):</span>
            </div>

            {/* 2 Dedicated Option Buttons: Front vs Back */}
            <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto bg-slate-900 p-1 rounded-xl border border-slate-800">
              {/* Option 1: Front Camera */}
              <button
                type="button"
                onClick={() => handleSelectFacingMode('user')}
                className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  facingMode === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950 border border-purple-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <User size={14} />
                <span>🤳 Front Camera</span>
              </button>

              {/* Option 2: Back Camera */}
              <button
                type="button"
                onClick={() => handleSelectFacingMode('environment')}
                className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  facingMode === 'environment'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950 border border-purple-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Camera size={14} />
                <span>📷 Back Camera</span>
              </button>
            </div>
          </div>
        )}

        {/* Camera Viewport / Captured Preview */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {/* Visual Flash Effect */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-ping opacity-90 transition-opacity" />
          )}

          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <AlertCircle size={42} className="text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-300">{cameraError}</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSelectFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <FlipHorizontal size={14} /> {facingMode === 'user' ? 'Back क्यामेरा खोल्नुहोस्' : 'Front क्यामेरा खोल्नुहोस्'}
                </button>
                <button
                  onClick={() => startCamera(facingMode, selectedDeviceId || undefined)}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  <RefreshCw size={14} /> पुनः प्रयास
                </button>
              </div>
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
              <div className="absolute top-3 left-3 bg-emerald-600/90 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg border border-emerald-400/30">
                <CheckCircle size={14} /> फोटो खिचियो (Snapshot Ready)
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
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-100'}`}
              />

              {/* Loading Indicator */}
              {cameraLoading && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-2.5">
                  <RefreshCw className="animate-spin text-purple-400" size={36} />
                  <p className="text-xs text-purple-200 font-semibold tracking-wide">
                    {facingMode === 'user' ? '🤳 Front क्यामेरा सुरु हुँदैछ...' : '📷 Back क्यामेरा सुरु हुँदैछ...'}
                  </p>
                </div>
              )}

              {/* Viewfinder Target Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 sm:w-64 h-72 sm:h-80 border-2 border-dashed border-white/40 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/90 bg-black/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/20 whitespace-nowrap">
                    {facingMode === 'user' ? '👤 Face Focus (Front)' : '📄 Guest / ID Focus (Back)'}
                  </div>
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400"></div>
                </div>
              </div>

              {/* In-viewport Controls Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-auto">
                {/* Switch camera button inside feed */}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Switch Camera (Front/Back)"
                  className="bg-black/70 hover:bg-purple-900/80 text-white px-3 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
                >
                  <FlipHorizontal size={16} className="text-purple-300" />
                  <span>{facingMode === 'user' ? 'Switch to Back' : 'Switch to Front'}</span>
                </button>

                {/* Active Camera Badge */}
                <div className="bg-black/70 px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-200 border border-white/10 flex items-center gap-2 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{facingMode === 'user' ? 'Front (Selfie)' : 'Back (Rear)'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
              >
                <RefreshCw size={15} /> फेरि खिच्नुहोस् (Retake)
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 sm:px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    बचत हुँदैछ...
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
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
                className="px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                रद्द गर्नुहोस् (Cancel)
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={cameraLoading || Boolean(cameraError)}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-black transition shadow-lg shadow-purple-950/50 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Camera size={18} />
                फोटो खिच्नुहोस् (Take Photo)
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
