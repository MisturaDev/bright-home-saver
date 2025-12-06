import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { energyTips } from '@/lib/energy-data';
import { ArrowLeft, Lightbulb, TrendingDown } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const TipsScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-primary px-6 pt-8 pb-12 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Energy Saving Tips</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-primary-foreground/20 rounded-2xl p-4">
          <div className="w-14 h-14 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-primary-foreground font-semibold">Potential Monthly Savings</p>
            <p className="text-2xl font-bold text-primary-foreground">Up to ₦8,000</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 space-y-4">
        {energyTips.map((tip, index) => (
          <Card 
            key={tip.title}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{tip.description}</p>
                  <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">{tip.savings}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default TipsScreen;
