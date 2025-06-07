import '../../lib/amplifyClient';
import SignInForm from '../../components/SignInForm';

export default function SignInPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Sign In</h1>
      <SignInForm />
    </div>
  );
}
