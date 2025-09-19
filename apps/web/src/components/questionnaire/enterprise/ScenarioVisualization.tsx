"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScenarioVisualizationProps {
  scenarios: any[];
  selectedScenario?: string;
  className?: string;
}

export default function ScenarioVisualization({
  scenarios = [],
  selectedScenario,
  className = ""
}: ScenarioVisualizationProps) {
  // Mock data for visualization
  const data = [
    { year: 'Year 1', base: 100, optimistic: 120, conservative: 80 },
    { year: 'Year 2', base: 110, optimistic: 140, conservative: 85 },
    { year: 'Year 3', base: 125, optimistic: 165, conservative: 95 },
    { year: 'Year 4', base: 140, optimistic: 190, conservative: 105 },
    { year: 'Year 5', base: 155, optimistic: 220, conservative: 115 },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Scenario Projections</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="base" stroke="#8884d8" name="Base Case" />
            <Line type="monotone" dataKey="optimistic" stroke="#82ca9d" name="Optimistic" />
            <Line type="monotone" dataKey="conservative" stroke="#ffc658" name="Conservative" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}