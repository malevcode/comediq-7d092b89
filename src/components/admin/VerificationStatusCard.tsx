import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { VerificationStats } from './hooks/useMicAnalytics';

interface VerificationStatusCardProps {
  stats: VerificationStats;
}

export const VerificationStatusCard = ({ stats }: VerificationStatusCardProps) => {
  const getVerificationColor = (type: 'verified' | 'verified_tediously' | 'unverified') => {
    switch (type) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'verified_tediously':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unverified':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getVerificationIcon = (type: 'verified' | 'verified_tediously' | 'unverified') => {
    switch (type) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'verified_tediously':
        return <Clock className="w-4 h-4" />;
      case 'unverified':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-sm text-gray-600">Verified</div>
              <div className="text-xs text-gray-500">{stats.verifiedPercentage.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.verifiedTediously}</div>
              <div className="text-sm text-gray-600">Tediously Verified</div>
              <div className="text-xs text-gray-500">{stats.verifiedTediouslyPercentage.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unverified}</div>
              <div className="text-sm text-gray-600">Unverified</div>
              <div className="text-xs text-gray-500">{stats.unverifiedPercentage.toFixed(1)}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>{((stats.verified + stats.verifiedTediously) / stats.total * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.verifiedPercentage}%` }}
              />
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300 -mt-2"
                style={{ width: `${stats.verifiedTediouslyPercentage}%`, marginLeft: `${stats.verifiedPercentage}%` }}
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getVerificationColor('verified')} flex items-center gap-1`}>
              {getVerificationIcon('verified')}
              Verified ({stats.verified})
            </Badge>
            <Badge className={`${getVerificationColor('verified_tediously')} flex items-center gap-1`}>
              {getVerificationIcon('verified_tediously')}
              Tediously Verified ({stats.verifiedTediously})
            </Badge>
            <Badge className={`${getVerificationColor('unverified')} flex items-center gap-1`}>
              {getVerificationIcon('unverified')}
              Unverified ({stats.unverified})
            </Badge>
          </div>

          {/* Insights */}
          <div className="text-sm text-gray-600 space-y-1">
            {stats.unverified > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{stats.unverified} mics need verification</span>
              </div>
            )}
            {stats.verifiedTediously > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>{stats.verifiedTediously} mics verified tediously (may need re-verification)</span>
              </div>
            )}
            {stats.verified > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{stats.verified} mics properly verified</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 