import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // ── Primary: Microsoft 365 / Azure AD (school accounts) ─────────────────
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
    }),

    // ── Fallback: GitHub OAuth ───────────────────────────────────────────────
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // DB에서 role 조회
        const teacher = await prisma.teacher.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        ;(session.user as any).role = teacher?.role || 'TEACHER'
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
}
