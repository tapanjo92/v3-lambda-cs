'use client';
import { useState } from 'react';
import { signUp, confirmSignUp } from '@aws-amplify/auth';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'signup' | 'confirm'>('signup');
  const [message, setMessage] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signUp({ username: email, password });
      setStage('confirm');
    } catch (err) {
      if (err instanceof Error) setMessage(err.message);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setMessage('Confirmed! You can sign in.');
    } catch (err) {
      if (err instanceof Error) setMessage(err.message);
    }
  }

  return (
    <form onSubmit={stage === 'signup' ? handleSignUp : handleConfirm} className="flex flex-col gap-2 max-w-sm">
      <input
        className="border p-2 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {stage === 'signup' && (
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      )}
      {stage === 'confirm' && (
        <input
          className="border p-2 rounded"
          placeholder="Confirmation Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      )}
      <button className="bg-blue-600 text-white p-2 rounded" type="submit">
        {stage === 'signup' ? 'Sign Up' : 'Confirm'}
      </button>
      {message && <p className="text-red-600">{message}</p>}
    </form>
  );
}
