import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdsDashboardCards } from './AdsDashboardCards';
import { AdvertisersList } from './AdvertisersList';
import { OutreachLog } from './OutreachLog';
import { ActiveAdsList } from './ActiveAdsList';
import { AllAdsList } from './AllAdsList';
import { AdClickLog } from './AdClickLog';

export function AdsManagerTabs() {
  return (
    <div className="space-y-4">
      <AdsDashboardCards />
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="active" className="text-xs">Active Ads</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All Ads</TabsTrigger>
          <TabsTrigger value="clicks" className="text-xs">Click Log</TabsTrigger>
          <TabsTrigger value="advertisers" className="text-xs">Advertisers</TabsTrigger>
          <TabsTrigger value="outreach" className="text-xs">Outreach</TabsTrigger>
        </TabsList>
        <TabsContent value="active"><ActiveAdsList /></TabsContent>
        <TabsContent value="all"><AllAdsList /></TabsContent>
        <TabsContent value="clicks"><AdClickLog /></TabsContent>
        <TabsContent value="advertisers"><AdvertisersList /></TabsContent>
        <TabsContent value="outreach"><OutreachLog /></TabsContent>
      </Tabs>
    </div>
  );
}