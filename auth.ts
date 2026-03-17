import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { SanityAdapter } from "next-auth-sanity"
import { sanityClient } from "./src/sanity/client"
import { sanityWriteClient } from "./src/sanity/client"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { comparePassword } from "./src/lib/auth"
import crypto from "crypto"

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: SanityAdapter(sanityClient),
    providers: [
        Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: "login@dripngrid.in",
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                loginToken: { label: "Login Token", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                const { email } = credentials;

                // ── OTP-based passwordless login ──────────────────────────
                if (credentials.loginToken) {
                    const hashed = hashToken(credentials.loginToken as string);
                    const tokenRecord = await sanityWriteClient.fetch(
                        `*[_type == "otp" && email == $email && otp == $hashed && purpose == "login-token" && expiresAt > now()][0]`,
                        { email, hashed }
                    );
                    if (!tokenRecord) return null;
                    // Consume the token immediately (single-use)
                    await sanityWriteClient.delete(tokenRecord._id);

                    const user = await sanityClient.fetch(
                        `*[_type == "user" && email == $email][0]`,
                        { email }
                    );
                    if (!user) return null;
                    return { id: user._id, name: user.name, email: user.email, image: user.image ?? null };
                }

                // ── Password-based login (kept for backward compat) ───────
                if (credentials.password) {
                    const user = await sanityClient.fetch(
                        `*[_type == "user" && email == $email][0]`,
                        { email }
                    );
                    if (!user || !user.password) return null;
                    const isValid = await comparePassword(credentials.password as string, user.password as string);
                    if (!isValid) return null;
                    return { id: user._id, name: user.name, email: user.email, image: user.image ?? null };
                }

                return null;
            }
        })
    ],
    pages: {
        signIn: '/account',
    },
    callbacks: {
        async session({ session, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        }
    }
})
