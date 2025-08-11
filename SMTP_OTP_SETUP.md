# SMTP OTP Setup Instructions

## Overview
The GlobeTrotter application now supports SMTP-based OTP (One-Time Password) verification for enhanced login security. Users can receive a 6-digit OTP via email when logging in.

## Features
- ✅ Email-based OTP verification during login
- ✅ 10-minute OTP expiration for security
- ✅ Beautiful, branded email templates
- ✅ Admin control to enable/disable OTP per user
- ✅ Fallback to regular login for users with OTP disabled
- ✅ Google OAuth unaffected (bypasses OTP)

## SMTP Configuration

### 1. Update Environment Variables
Add the following to your `.env.local` file:

```env
# SMTP Configuration for OTP emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 2. Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings > Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a password for "Mail"
   - Use this password in `SMTP_PASS`

### 3. Other Email Providers
- **Outlook/Hotmail**: 
  - SMTP_HOST: "smtp-mail.outlook.com"
  - SMTP_PORT: "587"
- **Yahoo**: 
  - SMTP_HOST: "smtp.mail.yahoo.com"
  - SMTP_PORT: "587"

## User Experience

### Login Flow
1. User enters email and password
2. System validates credentials
3. If OTP is enabled:
   - 6-digit OTP sent to user's email
   - User enters OTP on verification screen
   - System validates OTP and completes login
4. If OTP is disabled:
   - Direct login (traditional flow)

### Admin Controls
- Admins can enable/disable OTP for individual users
- Navigate to Admin > Users > [Select User]
- Toggle OTP in the Security Settings section

## Database Changes
- Added `isOtpEnabled` field to User model (default: true)
- Added `OtpCode` model for storing temporary verification codes
- OTP codes expire after 10 minutes
- Used OTP codes are marked as `used: true`

## API Endpoints
- `POST /api/auth/send-otp` - Send OTP after credential validation
- `POST /api/auth/verify-otp` - Verify OTP and return user data
- `PATCH /api/admin/users/[userId]/otp` - Toggle OTP setting (Admin only)

## Security Features
- OTP codes are single-use only
- 10-minute expiration window
- Automatic cleanup of expired/used codes
- Email validation before OTP generation
- Rate limiting through single OTP per login attempt

## Troubleshooting

### **Common Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**

This error means Gmail is rejecting your credentials. Here's how to fix it:

#### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", enable "2-Step Verification"
3. Complete the setup process

#### **Step 2: Generate App Password**
1. In Google Account Security, find "App passwords"
2. You might need to sign in again
3. Select "Mail" as the app type
4. Click "Generate"
5. Copy the 16-character password (format: "abcd efgh ijkl mnop")
6. **Important**: Use this App Password, NOT your regular Gmail password

#### **Step 3: Update Environment Variables**
```env
SMTP_USER="your-email@gmail.com"
SMTP_PASS="abcdefghijklmnop"  # 16-character app password
```

#### **Step 4: Test SMTP Connection**
Use the admin test endpoint: `GET /api/admin/test-smtp`

### **Alternative: Use a Test Email Service**

For development, consider using Mailtrap or Ethereal Email:

#### **Mailtrap Configuration:**
```env
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-mailtrap-username"
SMTP_PASS="your-mailtrap-password"
```

#### **Ethereal Email (Free Testing):**
```env
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="generated-user@ethereal.email"
SMTP_PASS="generated-password"
```

### Email Not Sending
1. Check SMTP credentials in `.env.local`
2. Verify email provider allows app passwords
3. Check server logs for detailed error messages
4. Test with different email providers

### OTP Not Working
1. Check if OTP is enabled for the user
2. Verify OTP hasn't expired (10 minutes)
3. Ensure OTP hasn't been used already
4. Check database `otp_codes` table for valid entries

### Development Testing
- Use a test email service like Mailtrap for development
- Set up email logging to see sent emails without actual delivery
- Test with both OTP-enabled and OTP-disabled users

## Production Recommendations
1. Use a dedicated email service (SendGrid, AWS SES, etc.)
2. Implement rate limiting on OTP requests
3. Add monitoring for email delivery failures
4. Consider backup authentication methods
5. Log authentication attempts for security auditing
