'use client';

import Image from "next/image";
import { EudiVerifyButton, EudiQRScanner } from "@emtyg/next-eudi";
import { useState } from "react";

export default function Home() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSimulateWalletScan = async (age: number) => {
    if (!currentSessionId) {
      setTestResult('❌ No active QR session. Generate a QR code first.');
      return;
    }
    
    setLoading(true);
    setTestResult(null);
    
    try {
      // Step 1: Generate mock presentation (simulating wallet)
      const mockResponse = await fetch(`/api/eudi/mock?age=${age}`);
      const { presentation } = await mockResponse.json();
      
      // Step 2: Post to callback (simulating what wallet would do)
      const callbackResponse = await fetch('/api/eudi/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vp_token: presentation,
          state: currentSessionId
        })
      });
      
      const result = await callbackResponse.json();
      
      if (callbackResponse.ok) {
        setTestResult(`✅ Wallet scan simulated (age ${age})! QR scanner will update automatically.`);
      } else {
        setTestResult(`❌ Simulation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            EUDI Age Verification Example
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This example demonstrates the @emtyg/next-eudi library for age verification
            using EUDI Wallets and verifiable credentials.
          </p>
          
          <div className="mt-4 flex flex-col gap-6 w-full max-w-2xl">
            {/* QR Code Scanner Section */}
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Scan with EUDI Wallet
              </h3>
              <div className="flex flex-col items-center">
                <EudiQRScanner
                  minAge={18}
                  onSessionCreated={(sessionId) => {
                    setCurrentSessionId(sessionId);
                    setTestResult(null);
                    setQrResult(null);
                  }}
                  onSuccess={(result) => {
                    setQrResult(`✅ Verified via QR! Age ${result.isOldEnough ? '18+' : '<18'}`);
                    console.log('QR Verification result:', result);
                  }}
                  onError={(error) => {
                    setQrResult(`❌ QR verification failed: ${error}`);
                  }}
                />
                {qrResult && (
                  <div className="mt-4 p-3 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium w-full text-center">
                    {qrResult}
                  </div>
                )}
              </div>
            </div>

            {/* Mock Testing Section */}
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <EudiVerifyButton minAge={18} />
              
              <div className="flex flex-col gap-2 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Simulate Wallet Scan:</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  These buttons simulate scanning the QR code above with a wallet of different ages
                </p>
                
                <button
                  onClick={() => handleSimulateWalletScan(16)}
                  disabled={loading || !currentSessionId}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm text-white transition-colors hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Scanning...' : 'Scan with Age 16 Wallet (should fail)'}
                </button>
                
                <button
                  onClick={() => handleSimulateWalletScan(25)}
                  disabled={loading || !currentSessionId}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm text-white transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Scanning...' : 'Scan with Age 25 Wallet (should pass)'}
                </button>
                
                <button
                  onClick={() => handleSimulateWalletScan(32)}
                  disabled={loading || !currentSessionId}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Scanning...' : 'Scan with Age 32 Wallet (should pass)'}
                </button>
              </div>
              
              {testResult && (
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium mt-4">
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
