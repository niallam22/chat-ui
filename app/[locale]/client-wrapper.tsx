"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { GlobalState } from "@/components/utility/global-state"
import { ReactNode } from "react"
import { Nullable } from "@/types"
import { Session } from "@supabase/supabase-js"

const queryClient = new QueryClient()

interface ClientWrapperProps {
  children: ReactNode
  session: Nullable<Session>
}

export function ClientWrapper({ children, session }: ClientWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-center" duration={3000} />
      <div className="bg-background text-foreground flex h-dvh flex-col items-center overflow-x-auto">
        {session ? <GlobalState>{children}</GlobalState> : children}
      </div>
    </QueryClientProvider>
  )
}
