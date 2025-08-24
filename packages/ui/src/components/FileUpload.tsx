import React, { useState, useCallback } from 'react';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  fileName?: string | null;
  error?: string | null;
  accept?: string;
  title: string;
  description: string;
  isLoading?: boolean;
}

export function FileUpload({ 
  onFileUpload, 
  fileName, 
  error, 
  accept = '.ros,.rosz',
  title,
  description,
  isLoading = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((file: File) => {
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  }, [handleFileChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [handleFileChange]);

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : fileName
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 dark:hover:border-primary-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center space-y-4">
          {fileName ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Datei erfolgreich geladen
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                  <File className="w-4 h-4 mr-1" />
                  {fileName}
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Fehler beim Laden
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className={`w-12 h-12 transition-colors ${
                isDragging 
                  ? 'text-primary-500' 
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isDragging ? 'Datei hier ablegen' : 'Datei hier ablegen oder klicken'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unterstützte Formate: {accept}
                </p>
              </div>
            </>
          )}
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-dark-800/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Wird verarbeitet...</span>
            </div>
          </div>
        )}
      </div>

      {fileName && !error && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ Bereit für den nächsten Schritt
          </p>
        </div>
      )}
    </div>
  );
}
