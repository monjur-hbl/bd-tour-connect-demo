import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const FacebookCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    const errorReason = searchParams.get('error_reason');

    if (error || errorCode) {
      const fullError = errorDescription || errorReason || error || `Error code: ${errorCode}`;
      setErrorMessage(fullError);

      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'FACEBOOK_AUTH_ERROR', error: fullError, errorCode },
          window.location.origin
        );
        setTimeout(() => window.close(), 3000);
      }
      return;
    }

    if (code) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'FACEBOOK_AUTH_SUCCESS', code, state },
          window.location.origin
        );
        window.close();
      }
    }
  }, [searchParams]);

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Authentication Failed</p>
          <p className="text-sm text-gray-500 mb-4">{errorMessage}</p>
          <p className="text-xs text-gray-400">This window will close in 3 seconds...</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing Facebook authentication...</p>
        <p className="text-sm text-gray-400 mt-2">This window will close automatically</p>
      </div>
    </div>
  );
};
