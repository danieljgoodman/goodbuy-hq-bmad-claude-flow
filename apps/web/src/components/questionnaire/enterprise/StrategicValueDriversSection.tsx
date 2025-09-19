import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { IPPortfolioSubsection } from './sections/IPPortfolioSubsection';
import { StrategicPartnershipsSubsection } from './sections/StrategicPartnershipsSubsection';
import { BrandAssetsSubsection } from './sections/BrandAssetsSubsection';
import { CompetitiveMoatSubsection } from './sections/CompetitiveMoatSubsection';
import { Target, Shield, Crown, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface StrategicValueDriversSectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const StrategicValueDriversSection: React.FC<StrategicValueDriversSectionProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const updateSection = (section: string, sectionData: any) => {
    onUpdate({
      ...data,
      strategicValueDrivers: {
        ...data.strategicValueDrivers,
        [section]: sectionData
      }
    });
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
            <Target className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Strategic Value Drivers
            </h2>
            <Badge variant="secondary" className="tier-enterprise mt-2">
              Section 6 of 10
            </Badge>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Evaluate your intellectual property, strategic partnerships, brand assets, and competitive advantages
          that create sustainable value and market position.
        </p>
      </motion.div>

      {/* Strategic Value Overview */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.1 }}
      >
        <Card className="tier-enterprise">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <span>Strategic Value Assessment</span>
            </CardTitle>
            <CardDescription>
              Your strategic assets and competitive positioning drive long-term enterprise value
              beyond traditional financial metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 mx-auto" />
                </div>
                <h4 className="font-medium">IP Portfolio</h4>
                <p className="text-sm text-muted-foreground">Patents, trademarks, and proprietary assets</p>
              </div>
              <div className="text-center space-y-2">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600 mx-auto" />
                </div>
                <h4 className="font-medium">Partnerships</h4>
                <p className="text-sm text-muted-foreground">Strategic alliances and revenue channels</p>
              </div>
              <div className="text-center space-y-2">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Crown className="h-6 w-6 text-purple-600 mx-auto" />
                </div>
                <h4 className="font-medium">Brand Assets</h4>
                <p className="text-sm text-muted-foreground">Market position and customer equity</p>
              </div>
              <div className="text-center space-y-2">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600 mx-auto" />
                </div>
                <h4 className="font-medium">Competitive Moat</h4>
                <p className="text-sm text-muted-foreground">Sustainable competitive advantages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* IP Portfolio */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.2 }}
      >
        <IPPortfolioSubsection
          data={data.strategicValueDrivers?.ipPortfolio || {}}
          onUpdate={(sectionData) => updateSection('ipPortfolio', sectionData)}
        />
      </motion.div>

      <Separator className="my-8" />

      {/* Strategic Partnerships */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.3 }}
      >
        <StrategicPartnershipsSubsection
          data={data.strategicValueDrivers?.strategicPartnerships || {}}
          onUpdate={(sectionData) => updateSection('strategicPartnerships', sectionData)}
        />
      </motion.div>

      <Separator className="my-8" />

      {/* Brand & Market Assets */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.4 }}
      >
        <BrandAssetsSubsection
          data={data.strategicValueDrivers?.brandAssets || {}}
          onUpdate={(sectionData) => updateSection('brandAssets', sectionData)}
        />
      </motion.div>

      <Separator className="my-8" />

      {/* Competitive Moat Analysis */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.5 }}
      >
        <CompetitiveMoatSubsection
          data={data.strategicValueDrivers?.competitiveMoat || {}}
          onUpdate={(sectionData) => updateSection('competitiveMoat', sectionData)}
        />
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 0.6 }}
        className="flex justify-between pt-8"
      >
        <Button 
          variant="outline" 
          onClick={onPrevious}
          className="tier-enterprise"
        >
          Previous Section
        </Button>
        <Button 
          onClick={onNext}
          className="tier-enterprise"
        >
          Continue to Exit Strategy
        </Button>
      </motion.div>
    </div>
  );
};