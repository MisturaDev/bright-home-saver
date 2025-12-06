import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, TrendingDown, Shield } from 'lucide-react';
import logo from '@/assets/logo.png';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Zap, title: 'Track Usage', description: 'Monitor your energy consumption in real-time' },
    { icon: TrendingDown, title: 'Save Money', description: 'Get insights to reduce your electricity bills' },
    { icon: Shield, title: 'Smart Alerts', description: 'Receive notifications for high consumption' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="animate-float mb-8">
          <img src={logo} alt="Smart Home Energy Saver" className="w-32 h-32 object-contain" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground text-center mb-3">
          Smart Home<br />
          <span className="text-gradient">Energy Saver</span>
        </h1>
        
        <p className="text-muted-foreground text-center mb-10 max-w-xs">
          Track, manage, and reduce your home energy consumption effortlessly
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-10">
          {features.map(({ icon: Icon, title, description }, index) => (
            <div 
              key={title} 
              className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 pb-8">
        <Button 
          onClick={() => navigate('/auth')} 
          className="w-full"
          size="lg"
        >
          Get Started
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/auth')}
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
