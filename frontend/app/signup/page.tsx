import '../../lib/amplifyClient';
import SignUpForm from '../../components/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Sign Up</h1>
      <SignUpForm />
    </div>
  );
}
