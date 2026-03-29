import OrgNav from '@/components/organiser/OrgNav'

export default function OrganiserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OrgNav />
    </>
  )
}
