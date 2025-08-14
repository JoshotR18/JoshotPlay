import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-slate-100 dark:from-background dark:to-slate-900">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="items-center">
            <img src="/logo.png" alt="JoshotPlay Logo" className="w-24 h-24 mb-4" />
            <CardTitle className="text-2xl text-center">Welcome to JoshotPlay</CardTitle>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              theme="light"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;