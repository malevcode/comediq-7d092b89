import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import { PlaylistsTab } from "@/components/playlists";

export default function Playlists() {
  return (
    <>
      <SEO
        title="My Playlists | Comediq"
        description="Create and manage your Comediq open mic playlists."
        url="https://comediq.us/playlists"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-24">
        <PageHeader title="Playlists" subtitle="Your saved mic collections" />
        <div className="pt-28">
          <PlaylistsTab />
        </div>
      </div>
    </>
  );
}
