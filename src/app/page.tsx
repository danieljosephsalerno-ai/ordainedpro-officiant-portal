
// import { redirect } from "next/navigation"
// import { createClient } from "@/supabase/utils/server"
// import PortalClient from "./PortalClient"

// export default async function OfficiantPortalPage() {
//   const supabase = createClient()

//   // ✅ Fetch the user on the server
//   const { data, error } = await supabase.auth.getUser()

//   console.log("🧠 Server-side Supabase getUser() result:")
//   console.log("data:", data)
//   console.log("error:", error)
//   const user = data?.user

//   if (!user) {
//     redirect(`/auth?next=/officiant-portal`)
//   }

//   console.log("✅ User authenticated on server:", user.email)
//   console.warn("✅ User authenticated on server:", user.email)

//   return <PortalClient user={user} />
// }
import { redirect } from "next/navigation"
import { createClient } from "@/supabase/utils/server"
import PortalClient from "./PortalClient"

export default async function OfficiantPortalPage() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) {
    redirect(`/auth?next=/officiant-portal`)
  }

  console.log("✅ User authenticated on server:", user?.email)

  // ✅ Safely pass only serializable, defined string props
  return (
    <PortalClient
      user={{
        id: user?.id ?? "",
        email: user?.email ?? "",
      }}
    />
  )
}
