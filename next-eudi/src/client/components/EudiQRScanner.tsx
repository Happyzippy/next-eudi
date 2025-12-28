'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';

interface EudiQRScannerProps {
  /**
   * Minimum age required for verification
   */
  minAge?: number;
  
  /**
   * API endpoint base URL for handling OIDC4VP flow
   * Defaults to /api/eudi
   */
  apiBaseUrl?: string;
  
  /**
   * Callback when verification succeeds
   */
  onSuccess?: (result: { isOldEnough: boolean; claims: Record<string, unknown> }) => void;
  
  /**
   * Callback when verification fails
   */
  onError?: (error: string) => void;
  
  /**
   * Callback when session is created (receives session ID for mock testing)
   */
  onSessionCreated?: (sessionId: string) => void;
  
  /**
   * Custom styling for the container
   */
  className?: string;
  
  /**
   * Size of the QR code in pixels
   */
  size?: number;
}

/**
 * EudiQRScanner - QR code component for EUDI Wallet verification
 * 
 * Displays a QR code that users can scan with their EUDI Wallet.
 * Handles the OIDC4VP authorization flow automatically.
 * 
 * @example
 * ```tsx
 * <EudiQRScanner 
 *   minAge={18}
 *   onSuccess={(result) => console.log('Verified!', result)}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */
export function EudiQRScanner({
  minAge = 18,
  apiBaseUrl = '/api/eudi',
  onSuccess,
  onError,
  onSessionCreated,
  className = '',
  size = 256
}: EudiQRScannerProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionId, setSessionId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeSession();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [minAge]);

  const initializeSession = async () => {
    try {
      setStatus('generating');
      setErrorMessage(null);
      
      // Create a new verification session
      const response = await fetch(`${apiBaseUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minAge })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create verification session');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Notify parent component of session ID for mock testing
      onSessionCreated?.(data.sessionId);
      
      // Generate authorization URL (OIDC4VP request)
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = `${origin}${apiBaseUrl}/callback`;
      
      // Danish AVP: Direct parameters in URL (no request_uri)
      const params = new URLSearchParams({
        response_type: 'vp_token',
        response_mode: 'direct_post',
        client_id: `redirect_uri:${callbackUrl}`,
        response_uri: callbackUrl,
        nonce: data.sessionId, // Use session ID as nonce for now
        state: data.sessionId
      });
      
      // Note: dcql_query will be added by authorize endpoint when implementing AVP
      // For now, keeping request_uri approach for compatibility
      const authUrl = `${origin}${apiBaseUrl}/authorize?session_id=${data.sessionId}`;
      const walletUrl = `openid4vp://?client_id=${encodeURIComponent(`redirect_uri:${callbackUrl}`)}&request_uri=${encodeURIComponent(authUrl)}&request_uri_method=post`;
      
      // Generate QR code
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, walletUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }
      
      setQrCodeUrl(walletUrl);
      setStatus('ready');
      
      // Start polling for verification result
      startPolling(data.sessionId);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize session';
      setErrorMessage(message);
      setStatus('error');
      onError?.(message);
    }
  };

  const startPolling = (sessionId: string) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/session/${sessionId}`);
        
        if (!response.ok) {
          return; // Keep polling
        }
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          setStatus('success');
          onSuccess?.({
            isOldEnough: data.result.isOldEnough,
            claims: data.result.claims || {}
          });
        } else if (data.status === 'scanned') {
          setStatus('verifying');
        } else if (data.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          const message = data.error || 'Verification failed';
          setErrorMessage(message);
          setStatus('error');
          onError?.(message);
        }
      } catch (error) {
        // Continue polling on error
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds (reduced frequency)
  };

  const handleRetry = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    initializeSession();
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`border-4 border-gray-200 rounded-lg ${
            status === 'success' ? 'opacity-50' : ''
          }`}
        />
        
        {status === 'generating' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Generating QR code...</p>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-90 rounded-lg">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-semibold">Verified!</p>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90 rounded-lg">
            <div className="text-center text-white p-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm font-semibold mb-2">Error</p>
              <p className="text-xs">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        {status === 'ready' && (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Scan with your EUDI Wallet to verify age {minAge}+
            </p>
            {sessionId && (
              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : ''}${apiBaseUrl}/authorize?session_id=${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Direct link to authorization request
              </a>
            )}
          </>
        )}
        
        {status === 'verifying' && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-600 font-medium">Verifying credentials...</p>
          </div>
        )}
        
        {status === 'error' && (
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
        
        {status === 'success' && (
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            Scan Another
          </button>
        )}
      </div>
    </div>
  );
}
