import AuthStatus from '@/components/AuthStatus';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthStatus />
    </div>
  );
}
