"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type FormValues = z.infer<typeof formSchema>

interface SignInFormProps {
  onSuccess: () => void
  onSignUpClick?: () => void
  loading?: 'email' | 'google' | null
  setLoading?: (val: 'email' | 'google' | null) => void
}

export function SignInForm({ onSuccess, onSignUpClick, loading, setLoading }: SignInFormProps) {
  const { signIn, signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (setLoading) setLoading('email');
        setError(null)
        const values = form.getValues();
        const success = await signIn(values.email, values.password)
        if (success) {
          onSuccess()
        } else {
          setError("Invalid email or password. Please try again.")
        }
        if (setLoading) setLoading(null);
      }} className="space-y-4">
        {error && <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={!!loading}>
          {loading === 'email' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <Button
          type="button"
          className="w-full mt-2 flex items-center justify-center gap-2"
          variant="outline"
          disabled={!!loading}
          onClick={async () => {
            if (setLoading) setLoading('google');
            setError(null)
            const success = await signInWithGoogle()
            if (success) {
              onSuccess()
            } else {
              setError("Google sign-in failed. Please try again.")
            }
            if (setLoading) setLoading(null);
          }}
        >
          {loading === 'google' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in with Google...
            </>
          ) : (
            <>
              <FcGoogle className="h-5 w-5" />
              Sign in with Google
            </>
          )}
        </Button>

        <div className="mt-4 text-center md:hidden">
          <div className="text-sm text-muted-foreground mb-2">Don't have an account?</div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onSignUpClick}
          >
            Sign Up
          </Button>
        </div>
      </form>
    </Form>
  )
}
