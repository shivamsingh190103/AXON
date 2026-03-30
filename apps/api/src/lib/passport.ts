import bcrypt from 'bcrypt'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as LocalStrategy } from 'passport-local'
import { prisma } from './prisma.js'
import { env } from './env.js'

passport.use(
  new LocalStrategy({ usernameField: 'email', passwordField: 'password', session: false }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (!user || !user.passwordHash) {
        done(null, false)
        return
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      done(null, valid ? (user as unknown as Express.User) : false)
    } catch (error) {
      done(error)
    }
  })
)

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
        passReqToCallback: true
      },
      async (_req, _accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value
        if (!email) {
          done(new Error('Google profile did not include email'))
          return
        }

        done(null, {
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value
        } as unknown as Express.User)
      }
    )
  )
}

export default passport
