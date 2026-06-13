import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  // No database adapter Ñ use JWT sessions
  session: {
    strategy: 'jwt',
  },
  providers: [
    // ?? Primary: Microsoft 365 / Azure AD (school accounts) ?????????????????
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
    }),

    // ?? Fallback: GitHub OAuth ???????????????????????????????????????????????
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        // Look up teacher role from DB on first login
        if (user.email) {
          const teacher = await prisma.teacher.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          }).catch(() => null)
          token.role = teacher?.role || 'TEACHER'
          token.teacherId = teacher?.id || null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ''
        ;(session.user as any).role = token.role || 'TEACHER'
        ;(session.user as any).teacherId = token.teacherId || null
        ;(session.user as any).email = token.email
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
}