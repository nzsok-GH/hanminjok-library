import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.email) {
        const teacher = await prisma.teacher
          .findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          })
          .catch(() => null)
        token.role = teacher?.role || 'TEACHER'
        token.teacherId = teacher?.id || null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ''
        ;(session.user as any).role = token.role || 'TEACHER'
        ;(session.user as any).teacherId = token.teacherId || null
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
}
