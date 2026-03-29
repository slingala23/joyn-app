// TODO: Event detail — fill rate bar, attendees, join/book button, share
export default function EventPage({ params }: { params: { id: string } }) {
  return <div className="p-4 font-sans text-ink">Event {params.id} — coming soon</div>
}
