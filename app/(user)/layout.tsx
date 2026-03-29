import BottomNav from '@/components/user/BottomNav'

// User app layout — wraps all joyn.uk routes
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
