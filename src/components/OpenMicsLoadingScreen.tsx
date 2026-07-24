export default function OpenMicsLoadingScreen() {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center px-4 py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-muted-foreground mb-8">Loading open mics...</p>
    </div>
  );
}
