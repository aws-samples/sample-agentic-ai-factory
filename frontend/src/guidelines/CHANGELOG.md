# Frontend Changelog

## Recent Updates

### Email Confirmation Workflow

**Added Email Verification Step to Sign-Up Process**

The sign-up workflow now includes a proper email confirmation step using Cognito's verification code system.

#### Changes Made:

1. **Server Service** (`src/services/server.ts`)
   - Added `confirmSignUp()` method to verify email with confirmation code
   - Added `resendConfirmationCode()` method to resend verification codes
   - Imported `confirmSignUp` and `resendSignUpCode` from AWS Amplify

2. **AuthScreen Component** (`src/components/AuthScreen.tsx`)
   - Added new `confirm` mode to the authentication flow
   - Added `confirmationCode` state for storing the verification code
   - Added `successMessage` state for positive feedback
   - Created `handleConfirmSignUp()` function to process verification
   - Created `handleResendCode()` function to resend codes
   - Updated UI to show verification form after sign-up
   - Email field is disabled and pre-filled during confirmation

3. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - Added `confirmSignUp()` method
   - Added `resendConfirmationCode()` method
   - Updated `signUp()` to return the full result object

4. **Documentation** (`README.md`)
   - Updated to reflect email verification requirement
   - Added examples for confirmation workflow

#### User Flow:

1. User fills out sign-up form (name, email, password)
2. User submits form
3. Cognito sends verification code to email
4. User is shown confirmation screen
5. User enters 6-digit code from email
6. Email is verified
7. User can now sign in

#### Features:

- **Verification Code Input**: 6-digit code entry with validation
- **Resend Code**: Button to request a new verification code
- **Success/Error Messages**: Clear feedback for all actions
- **Email Display**: Shows which email needs verification
- **Back Navigation**: Can return to sign-in if needed

#### UI States:

**Confirmation Screen:**
```
┌─────────────────────────────────┐
│ Verify Email                    │
├─────────────────────────────────┤
│ Email (disabled)                │
├─────────────────────────────────┤
│ Verification Code               │
│ [Enter 6-digit code]            │
├─────────────────────────────────┤
│ [Verify Email]                  │
├─────────────────────────────────┤
│ Resend verification code        │
│ Back to sign in                 │
└─────────────────────────────────┘
```

---

### Sign-Up Form Enhancement

**Added First Name and Last Name Fields**

The sign-up form now includes first name and last name fields that map to Cognito user attributes:

- **First Name** → `given_name` attribute in Cognito
- **Last Name** → `family_name` attribute in Cognito

#### Changes Made:

1. **AuthScreen Component** (`src/components/AuthScreen.tsx`)
   - Added `firstName` and `lastName` state variables
   - Added two-column grid layout for name fields in sign-up mode
   - Added validation to ensure names are provided
   - Names are passed as attributes to the sign-up service
   - Form is cleared after successful sign-up

2. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - Updated `signUp` function to accept optional `attributes` parameter
   - Supports passing custom Cognito attributes

3. **Documentation** (`README.md`)
   - Updated sign-up feature description
   - Added example showing how to use name attributes

#### Form Layout:

**Sign-Up Mode:**
```
┌─────────────────────────────────┐
│ First Name    │ Last Name       │
├─────────────────────────────────┤
│ Email                           │
├─────────────────────────────────┤
│ Password                        │
├─────────────────────────────────┤
│ Confirm Password                │
├─────────────────────────────────┤
│ [Create account]                │
└─────────────────────────────────┘
```

**Sign-In Mode:**
```
┌─────────────────────────────────┐
│ Email                           │
├─────────────────────────────────┤
│ Password                        │
├─────────────────────────────────┤
│ [Sign in]                       │
└─────────────────────────────────┘
```

#### Usage Example:

```typescript
import { serverService } from '@/services';

await serverService.signUp({
  username: 'john.doe@example.com',
  password: 'SecurePassword123!',
  email: 'john.doe@example.com',
  attributes: {
    given_name: 'John',
    family_name: 'Doe',
  },
});
```

#### Validation:

- First name and last name are required fields
- Names are trimmed of whitespace
- Empty names will show an error message
- All existing password validations remain in place

#### User Experience:

- Name fields only appear in sign-up mode
- Fields are disabled during loading states
- Form is automatically cleared after successful sign-up
- User is redirected to sign-in mode after account creation
