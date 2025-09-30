import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { OAuthProfile } from '../services/OAuthService';

// Configure Google OAuth strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const callbackURL = `${process.env.API_URL}/api/v1/oauth/google/callback`;
  console.log('Google OAuth callback URL:', callbackURL);
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const oauthProfile: OAuthProfile = {
        provider: 'google',
        providerId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        picture: profile.photos?.[0]?.value,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName
      };

      return done(null, oauthProfile);
    } catch (error) {
      console.error('Google OAuth strategy error:', error);
      return done(error, undefined);
    }
  }));
  console.log('Google OAuth strategy configured');
} else {
  console.log('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Configure Facebook OAuth strategy (only if credentials are provided)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.API_URL}/api/v1/oauth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'picture']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const oauthProfile: OAuthProfile = {
        provider: 'facebook',
        providerId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
        picture: profile.photos?.[0]?.value,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName
      };

      return done(null, oauthProfile);
    } catch (error) {
      console.error('Facebook OAuth strategy error:', error);
      return done(error, undefined);
    }
  }));
  console.log('✅ Facebook OAuth strategy configured');
} else {
  console.log('⚠️  Facebook OAuth not configured - missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
