'use client';
import { useState } from 'react';
import { signIn } from '@aws-amplify/auth';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signIn({ username: email, password });
      window.location.href = '/dashboard';
    } catch (err) {
      if (err instanceof Error) setMessage(err.message);
    }
  }

  return (
    <form onSubmit={handleSignIn} className="flex flex-col gap-2 max-w-sm">
      <input
        className="border p-2 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="bg-blue-600 text-white p-2 rounded" type="submit">
        Sign In
      </button>
      {message && <p className="text-red-600">{message}</p>}
    </form>
  );
}
