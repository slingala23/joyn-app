// TODO: Session detail — attendees, message, edit, cancel, share
export default function SessionDetailPage({ params }: { params: { id: string } }) {
  return <div className="p-4 font-sans text-ink">Session {params.id} — coming soon</div>
}
