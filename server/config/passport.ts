import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User';

export const configurePassport = () => {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ oauthId: profile.id, provider: 'google' });
        if (!user) {
          user = await User.create({
            oauthId: profile.id,
            provider: 'google',
            username: profile.displayName || profile.emails?.[0].value.split('@')[0] || 'User',
            email: profile.emails?.[0].value || '',
            avatar: profile.photos?.[0].value || '',
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err, undefined);
      }
    }));
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/auth/github/callback'
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ oauthId: profile.id, provider: 'github' });
        if (!user) {
          user = await User.create({
            oauthId: profile.id,
            provider: 'github',
            username: profile.username || profile.displayName || 'GitHub User',
            email: profile.emails?.[0].value || `${profile.username}@github.com`,
            avatar: profile.photos?.[0].value || '',
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err, undefined);
      }
    }));
  }
};
