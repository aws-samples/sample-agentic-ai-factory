import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AwsBanner } from './ui/aws-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { serverService } from '../services';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'confirm';

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await serverService.signIn({
        username: email,
        password,
      });

      if (result.isSignedIn) {
        const user = await serverService.getCurrentUser();
        onLogin(user);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);

    try {
      const result = await serverService.signUp({
        username: email,
        password,
        email,
        attributes: {
          given_name: firstName.trim(),
          family_name: lastName.trim(),
        },
      });

      setError('');

      // Check if confirmation is needed
      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setSuccessMessage('Account created! Please check your email for the verification code.');
        setMode('confirm');
        // Clear password fields but keep email
        setFirstName('');
        setLastName('');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Auto-confirmed, go to sign in
        setSuccessMessage('Account created successfully! Please sign in.');
        setMode('signin');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!confirmationCode.trim()) {
      setError('Please enter the confirmation code');
      return;
    }

    setLoading(true);

    try {
      await serverService.confirmSignUp(email, confirmationCode.trim());

      setSuccessMessage('Email verified successfully! You can now sign in.');
      setConfirmationCode('');
      setMode('signin');
    } catch (err: any) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Invalid confirmation code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await serverService.resendConfirmationCode(email);
      setSuccessMessage('Confirmation code resent! Please check your email.');
    } catch (err: any) {
      console.error('Resend code error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit =
    mode === 'signin' ? handleSignIn :
      mode === 'signup' ? handleSignUp :
        handleConfirmSignUp;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <AwsBanner description='' variant='compact' />

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Verify Email'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Enter your credentials to access your projects'
                : mode === 'signup'
                  ? 'Create a new account to get started'
                  : 'Enter the verification code sent to your email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                  {successMessage}
                </div>
              )}

              {mode === 'confirm' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmationCode">Verification Code</Label>
                    <Input
                      id="confirmationCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      disabled={loading}
                      required
                      maxLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Check your email for the verification code
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="partner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </>
              )}

              {mode !== 'confirm' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {mode === 'signup' && (
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters long
                      </p>
                    )}
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <Button 
                type="submit" 
                className="w-full rounded-md font-medium inline-flex items-center transition-colors"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    height: '38px'
                  }}
                disabled={loading}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                  
                {loading
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : mode === 'signup'
                      ? 'Create account'
                      : 'Verify Email'}
              </Button>
              
              {mode === 'confirm' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    Resend verification code
                  </button>
                </div>
              )}

              <div className="text-center">
                
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'confirm') {
                      setMode('signin');
                    } else {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                    }
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  {mode === 'signin'
                    ? "Don't have an account? Sign up"
                    : mode === 'signup'
                      ? 'Already have an account? Sign in'
                      : 'Back to sign in'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Powered by AWS
        </p>
      </div>
    </div>
  );
}
