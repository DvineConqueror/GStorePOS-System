# Password Reset Implementation

## Overview

This document describes the complete password reset functionality implemented for the SmartGrocery POS System. The implementation follows industry best practices for security and user experience.

## Features

###  Security Features
- **Secure Token Generation**: Uses crypto.randomBytes for cryptographically secure tokens
- **Token Expiration**: 15-minute expiry for reset tokens
- **Rate Limiting**: Prevents abuse with 5-minute cooldown between requests
- **Single Use Tokens**: Tokens are invalidated after successful password reset
- **IP & User Agent Tracking**: Logs request metadata for security auditing
- **Email Validation**: Only sends reset emails to existing, active accounts

###  Email Features
- **Professional Email Templates**: HTML and text versions
- **Responsive Design**: Mobile-friendly email layout
- **Security Warnings**: Clear instructions about token expiration and usage
- **Branding**: Consistent SmartGrocery branding

###  Technical Features
- **Modular Architecture**: Separate services for email, password reset, and token management
- **Database Indexing**: Optimized queries with proper indexes
- **Automatic Cleanup**: Expired tokens are automatically removed
- **Error Handling**: Comprehensive error handling and logging
- **TypeScript Support**: Full type safety throughout

## API Endpoints

### 1. Request Password Reset
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### 2. Verify Reset Token
```http
GET /api/v1/auth/verify-reset-token/:token
```

**Response:**
```json
{
  "success": true,
  "message": "Reset token is valid.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "expiresAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 3. Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "new_secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

## Database Schema

### PasswordResetToken Collection
```typescript
{
  _id: ObjectId,
  userId: string,           // Reference to User._id
  token: string,            // Secure random token
  expiresAt: Date,          // Token expiration (15 minutes)
  used: boolean,            // Whether token has been used
  usedAt?: Date,            // When token was used
  ipAddress?: string,       // Request IP address
  userAgent?: string,       // Request user agent
  createdAt: Date,          // Token creation time
  updatedAt: Date           // Last update time
}
```

**Indexes:**
- `token` (unique)
- `userId`
- `expiresAt` (TTL index)
- `used`

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:8080

# Store Configuration
STORE_NAME=SmartGrocery
```

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### Other SMTP Providers
Update the configuration in `EmailService.ts`:

```typescript
const emailConfig = {
  host: 'your-smtp-host.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@domain.com',
    pass: 'your-password',
  },
};
```

## Security Considerations

### Token Security
- Tokens are 32 bytes (64 hex characters) of cryptographically secure random data
- Tokens expire after 15 minutes
- Tokens are single-use only
- Tokens are invalidated after successful password reset

### Rate Limiting
- Maximum 5 requests per 15 minutes per IP
- 5-minute cooldown between reset attempts per email
- Prevents brute force and spam attacks

### Email Security
- No sensitive information in email content
- Generic success message (doesn't reveal if email exists)
- Clear security warnings and instructions

### Database Security
- Automatic cleanup of expired tokens
- IP and user agent logging for audit trails
- Proper indexing for performance

## Usage Flow

### 1. User Requests Password Reset
1. User enters email on forgot password page
2. System validates email format
3. System checks for recent reset attempts (rate limiting)
4. System generates secure token
5. System sends email with reset link
6. System returns generic success message

### 2. User Clicks Reset Link
1. Frontend extracts token from URL
2. Frontend calls verify endpoint to validate token
3. If valid, frontend shows password reset form
4. If invalid, frontend shows error message

### 3. User Resets Password
1. User enters new password
2. Frontend validates password strength
3. Frontend calls reset endpoint with token and new password
4. System validates token and updates password
5. System invalidates token
6. User can now login with new password

## Error Handling

### Common Error Scenarios
- **Invalid Email**: Generic success message (security)
- **Rate Limited**: Clear message with retry time
- **Expired Token**: Clear message to request new reset
- **Used Token**: Clear message that token was already used
- **Email Send Failure**: Server error with retry suggestion

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Monitoring and Maintenance

### Automatic Cleanup
- Expired tokens are automatically removed by MongoDB TTL index
- Used tokens older than 24 hours are cleaned up hourly
- Session cleanup service runs every 10 minutes

### Manual Cleanup
```typescript
// Clean up expired tokens
await PasswordResetService.cleanupExpiredTokens();

// Get token statistics
const stats = await PasswordResetService.getTokenStats();
```

### Health Checks
```typescript
// Check email service status
const emailStatus = EmailService.getStatus();

// Test email configuration
const emailTest = await EmailService.testEmailConfiguration();
```

## Testing

### Development Testing
- In development mode, reset tokens are returned in API responses
- Use these tokens to test the reset flow without email
- Email service can be tested independently

### Production Testing
- Use real email addresses for testing
- Verify email delivery and formatting
- Test token expiration and cleanup
- Test rate limiting behavior

## Frontend Integration

### Reset Link Format
```
${CLIENT_URL}/reset-password/${token}
```

### Frontend Implementation
1. Create forgot password page with email input
2. Create reset password page that extracts token from URL
3. Implement form validation and submission
4. Handle success/error states appropriately
5. Redirect to login page after successful reset

## Troubleshooting

### Common Issues

#### Email Not Sending
- Check email configuration in `.env`
- Verify SMTP credentials
- Check email service status: `EmailService.getStatus()`
- Test email configuration: `EmailService.testEmailConfiguration()`

#### Token Verification Failing
- Check token format (64 hex characters)
- Verify token hasn't expired (15 minutes)
- Check if token was already used
- Verify database connection

#### Rate Limiting Issues
- Check if user has recent reset attempts
- Verify rate limiting configuration
- Check IP address detection

### Debug Mode
Set `NODE_ENV=development` to enable:
- Token return in API responses
- Detailed error messages
- Email service debugging

## Performance Considerations

### Database Optimization
- Proper indexing on all query fields
- TTL index for automatic cleanup
- Compound indexes for complex queries

### Email Performance
- Async email sending
- Connection pooling
- Error handling and retry logic

### Memory Management
- Automatic cleanup of expired tokens
- Efficient token generation
- Minimal memory footprint

## Future Enhancements

### Potential Improvements
- **SMS Reset**: Add SMS-based password reset
- **Security Questions**: Add security questions as backup
- **Account Lockout**: Implement account lockout after failed attempts
- **Audit Logging**: Enhanced audit trail for security events
- **Multi-language**: Support for multiple languages in emails
- **Custom Templates**: Allow custom email templates per organization

### Scalability Considerations
- **Redis Integration**: Use Redis for token storage in high-traffic scenarios
- **Email Queue**: Implement email queue for better performance
- **Load Balancing**: Ensure compatibility with load balancers
- **CDN Integration**: Use CDN for email template assets

## Conclusion

This password reset implementation provides a secure, user-friendly, and maintainable solution for the SmartGrocery POS System. It follows industry best practices and includes comprehensive error handling, monitoring, and cleanup mechanisms.

The modular architecture makes it easy to extend and maintain, while the security features protect against common attack vectors. The email templates provide a professional user experience, and the automatic cleanup ensures optimal database performance.
