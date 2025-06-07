import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-3xl mb-4">Lambda Cold Start Dashboard</h1>
      <Link className="text-blue-600 underline" href="/signup">Sign Up</Link>
      <Link className="text-blue-600 underline" href="/signin">Sign In</Link>
    </div>
  );
}
