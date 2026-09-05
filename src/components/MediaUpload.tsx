"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon, Loader2 } from 'lucide-react';

interface MediaUploadProps {
  label?: string;
  accept?: 'image' | 'video' | 'both';
  maxSizeMb?: number;
  value?: string;
  onChange?: (url: string) => void;
  onUploadSuccess?: (data: { url: string; fileName: string; size: number; mediaType: string }) => void;
}

export default function MediaUpload({
  label = 'Upload Photo or Video',
  accept = 'both',
  maxSizeMb = 50,
  value,
  onChange,
  onUploadSuccess,
}: MediaUploadProps) {
  const [fileUrl, setFileUrl] = useState<string>(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes =
    accept === 'image'
      ? 'image/jpeg,image/png,image/webp,image/gif'
      : accept === 'video'
      ? 'video/mp4,video/webm,video/quicktime'
      : 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime';

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|mov)($|\?)/i) || url.startsWith('data:video');
  };

  const handleFile = async (file: File) => {
    setErrorMessage('');
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${maxSizeMb}MB maximum allowed size.`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload file.');
      }

      setFileUrl(data.data.url);
      if (onChange) onChange(data.data.url);
      if (onUploadSuccess) onUploadSuccess(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileUrl('');
    setErrorMessage('');
    if (onChange) onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}

      {fileUrl ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group">
          {isVideo(fileUrl) ? (
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <video src={fileUrl} controls className="max-h-64 w-full object-contain" />
            </div>
          ) : (
            <div className="relative aspect-video w-full max-h-64 flex items-center justify-center bg-slate-900/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt="Uploaded media"
                className="max-h-64 w-full object-contain"
              />
            </div>
          )}

          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium truncate">
              <CheckCircle size={15} />
              <span className="truncate">{fileUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove media"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <span className="text-sm font-medium text-slate-600">Uploading media to server...</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Click to upload <span className="text-slate-400 font-normal">or drag & drop</span>
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ImageIcon size={13} /> JPG, PNG, WebP
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FileVideo size={13} /> MP4, WebM (Max {maxSizeMb}MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
