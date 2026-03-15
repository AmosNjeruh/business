import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { googleAuth, setToken, setUser } from '@/services/auth';

interface GoogleSignInProps {
  mode: 'login' | 'signup';
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ mode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('No credential received from Google');
      return;
    }

    setIsLoading(true);
    try {
      const authResponse = await googleAuth({
        credential: credentialResponse.credential,
        role: 'VENDOR',
      });

      // Store token and user data in localStorage
      setToken(authResponse.token);
      setUser(authResponse.user);

      // Check if user is new or if profile is incomplete
      const isNewUser = authResponse.isNewUser || false;
      const vendorSettings = authResponse.user.vendorSettings;
      
      // Check if profile is incomplete (contactPhone required)
      const hasRequiredAuthFields = vendorSettings?.contactPhone;

      // If signup mode OR new user OR profile incomplete, redirect to settings
      if (mode === 'signup' || isNewUser || !hasRequiredAuthFields) {
        const message = isNewUser 
          ? 'Account created with Google! Please complete your profile.' 
          : mode === 'signup'
          ? 'Please complete your business profile.'
          : 'Please complete your business profile to continue.';
        
        toast.success(message, {
          duration: 4000,
        });
        // Redirect to admin dashboard - user can complete profile in settings
        router.push('/admin');
        return;
      } else {
        toast.success('Successfully signed in with Google!');
        router.push('/admin');
      }
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Google authentication failed';
      console.error('Google sign-in error:', error);
      toast.error(apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error?: any) => {
    console.error('Google OAuth error:', error);
    if (error?.type === 'popup_closed_by_user') {
      // User closed the popup, don't show error
      return;
    }
    toast.error(
      'Google authentication failed. Please check your Google OAuth configuration.'
    );
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
    return null;
  }

  return (
    <div className="mt-4 w-full">
      <style dangerouslySetInnerHTML={{
        __html: `
          .google-signin-container > div {
            display: flex !important;
            justify-content: center !important;
          }
          .google-signin-container iframe,
          .google-signin-container button {
            margin: 0 auto !important;
          }
        `
      }} />
      <GoogleOAuthProvider clientId={clientId}>
        <div className="relative w-full google-signin-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="filled_blue"
            size="large"
            width="100%"
            text={mode === 'login' ? 'signin_with' : 'signup_with'}
            shape="rectangular"
          />

          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/70 rounded-md flex items-center justify-center">
              <div className="flex items-center text-white text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </div>
            </div>
          )}
        </div>
      </GoogleOAuthProvider>
    </div>
  );
};

export default GoogleSignIn;
