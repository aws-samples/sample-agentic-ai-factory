# Email Verification Guide

## Overview

The application now includes a complete email verification workflow for new user sign-ups using AWS Cognito.

## User Journey

### Step 1: Sign Up
User fills out the registration form:
- First Name
- Last Name
- Email
- Password
- Confirm Password

### Step 2: Email Sent
After submitting the form:
- Cognito sends a 6-digit verification code to the user's email
- User sees a success message
- Screen automatically switches to verification mode

### Step 3: Verify Email
User enters the verification code:
- Email field is pre-filled and disabled
- User enters the 6-digit code from their email
- User clicks "Verify Email"

### Step 4: Confirmed
After successful verification:
- User sees success message
- Screen switches to sign-in mode
- User can now sign in with their credentials

## Features

### Automatic Flow
- Seamless transition from sign-up to verification
- No manual navigation required
- Email is preserved throughout the process

### Resend Code
- Users can request a new code if:
  - They didn't receive the original email
  - The code expired
  - They accidentally deleted the email

### Error Handling
- Clear error messages for:
  - Invalid codes
  - Expired codes
  - Network issues
  - Missing information

### Success Feedback
- Green success messages for:
  - Account creation
  - Code resent
  - Email verified

## Code Examples

### Basic Sign-Up Flow

```typescript
import { serverService } from '@/services';

// 1. Sign up
const result = await serverService.signUp({
  username: 'user@example.com',
  password: 'SecurePass123!',
  email: 'user@example.com',
  attributes: {
    given_name: 'John',
    family_name: 'Doe',
  },
});

// 2. Check if confirmation is needed
if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
  console.log('Verification code sent to email');
}

// 3. Confirm with code from email
await serverService.confirmSignUp('user@example.com', '123456');

// 4. Sign in
await serverService.signIn({
  username: 'user@example.com',
  password: 'SecurePass123!',
});
```

### Resending Verification Code

```typescript
import { serverService } from '@/services';

// Resend code to user's email
await serverService.resendConfirmationCode('user@example.com');
```

### Using the Auth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function SignUpComponent() {
  const { signUp, confirmSignUp, resendConfirmationCode } = useAuth();
  
  // Sign up
  const result = await signUp(
    'user@example.com',
    'SecurePass123!',
    'user@example.com',
    { given_name: 'John', family_name: 'Doe' }
  );
  
  // Confirm
  await confirmSignUp('user@example.com', '123456');
  
  // Resend if needed
  await resendConfirmationCode('user@example.com');
}
```

## UI Components

### Verification Screen Elements

1. **Email Display**
   - Shows the email that needs verification
   - Disabled to prevent changes
   - Provides context for the user

2. **Code Input**
   - 6-digit numeric code
   - Max length validation
   - Clear placeholder text
   - Helper text below

3. **Verify Button**
   - Primary action button
   - Shows loading state
   - Disabled during processing

4. **Resend Link**
   - Secondary action
   - Shows success message when clicked
   - Disabled during processing

5. **Back Link**
   - Returns to sign-in screen
   - Clears any error messages
   - Allows user to exit flow

## Error Messages

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid verification code" | Wrong code entered | Check email and re-enter code |
| "Code expired" | Code is too old | Click "Resend verification code" |
| "User already confirmed" | Email already verified | Go to sign-in screen |
| "User not found" | Email doesn't exist | Check email or sign up again |

## Best Practices

### For Users
1. Check spam/junk folder if code doesn't arrive
2. Code typically arrives within 1-2 minutes
3. Code expires after 24 hours
4. Use the resend feature if needed

### For Developers
1. Always handle the `nextStep` from sign-up result
2. Preserve email state between screens
3. Provide clear feedback for all actions
4. Handle network errors gracefully
5. Test with real email addresses

## Cognito Configuration

### Required Settings

In your Cognito User Pool:
- Email verification must be enabled
- Email must be a required attribute
- Verification code delivery method: Email

### Optional Settings
- Code expiration time (default: 24 hours)
- Email template customization
- From email address configuration

## Testing

### Manual Testing Checklist

- [ ] Sign up with valid email
- [ ] Receive verification code email
- [ ] Enter correct code - should succeed
- [ ] Enter wrong code - should show error
- [ ] Resend code - should receive new email
- [ ] Try to sign in before verification - should fail
- [ ] Complete verification - should allow sign in
- [ ] Try to verify already confirmed user - should handle gracefully

### Test Accounts

For development, you can use:
- Temporary email services (mailinator, temp-mail)
- Your own email with + addressing (user+test@example.com)
- AWS SES sandbox verified emails

## Troubleshooting

### Code Not Received
1. Check spam/junk folder
2. Verify email address is correct
3. Check Cognito email sending limits
4. Verify SES configuration (if using SES)

### Verification Fails
1. Ensure code is entered correctly
2. Check if code has expired
3. Verify user exists in Cognito
4. Check Cognito User Pool settings

### Cannot Sign In After Verification
1. Verify email confirmation status in Cognito console
2. Check user pool authentication settings
3. Ensure password meets requirements
4. Check for any account status issues
