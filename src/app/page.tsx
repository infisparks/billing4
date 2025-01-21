// app/your-page-directory/page.jsx or page.js

import { redirect } from 'next/navigation'

export default function Page() {
  // Perform a server-side redirect to /admin/dashboard
  redirect('/admin/selllist')
  
  // Optionally, you can return null or a loading state
  return null
}
