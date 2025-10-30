import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="text-center space-y-8 p-8 max-w-2xl">
        <div className="mx-auto w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
          <GraduationCap className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CampusWise
          </h1>
          <p className="text-2xl font-medium text-foreground">
            D4Media Institution Management System
          </p>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Complete school management solution for fee management, payroll, student & staff records, 
            expenses, reports, and more.
          </p>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
