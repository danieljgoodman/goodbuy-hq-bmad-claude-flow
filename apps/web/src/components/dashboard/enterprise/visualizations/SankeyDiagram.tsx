/**
 * Sankey Diagram Component for Cash Flow Analysis
 * Interactive flow diagram showing value transfers between entities
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type {
  SankeyNode as SankeyNodeType,
  SankeyLink as SankeyLinkType,
  VisualizationProps,
  ChartInteraction,
  ExportOptions
} from '@/lib/types/visualization';
import {
  createSVG,
  formatNumber,
  exportChart,
  COLOR_SCHEMES,
  DEFAULT_DIMENSIONS
} from '@/lib/utils/visualization-helpers';

interface SankeyDiagramProps extends Omit<VisualizationProps, 'data'> {
  nodes: SankeyNodeType[];
  links: SankeyLinkType[];
  onNodeClick?: (node: SankeyNodeType) => void;
  onLinkClick?: (link: SankeyLinkType) => void;
  showLabels?: boolean;
  enableZoom?: boolean;
}

interface ProcessedNode extends SankeyNode<{}, {}> {
  id: string;
  name: string;
  category?: string;
  color?: string;
  value?: number;
}

interface ProcessedLink extends SankeyLink<{}, {}> {
  source: ProcessedNode;
  target: ProcessedNode;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export function SankeyDiagram({
  nodes,
  links,
  config,
  onInteraction,
  onExport,
  onNodeClick,
  onLinkClick,
  showLabels = true,
  enableZoom = true,
  className = '',
  testId = 'sankey-diagram'
}: SankeyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<SankeyNodeType | null>(null);
  const [selectedLink, setSelectedLink] = useState<SankeyLinkType | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const renderSankey = () => {
    if (!containerRef.current || nodes.length === 0 || links.length === 0) return;

    const container = d3.select(containerRef.current);
    container.select('svg').remove();

    const dimensions = config.dimensions || {
      ...DEFAULT_DIMENSIONS,
      width: 1000,
      height: 600
    };

    const svg = createSVG(container, dimensions, 'sankey-svg');

    const width = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const height = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Create color scale for categories
    const categories = [...new Set(nodes.map(n => n.category || 'default'))];
    const colorScale = d3.scaleOrdinal(COLOR_SCHEMES.categorical)
      .domain(categories);

    // Prepare data for d3-sankey
    const sankeyData = {
      nodes: nodes.map(node => ({
        ...node,
        id: node.id,
        name: node.name,
        category: node.category,
        color: node.color || colorScale(node.category || 'default')
      })) as ProcessedNode[],
      links: links.map(link => ({
        source: link.source,
        target: link.target,
        value: link.value,
        color: link.color,
        metadata: link.metadata
      }))
    };

    // Create sankey layout
    const sankeyLayout = sankey<{}, {}>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 5]]);

    const sankeyGraph = sankeyLayout(sankeyData);

    // Create zoom behavior if enabled
    let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
    if (enableZoom) {
      zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
          const { transform } = event;
          g.attr('transform',
            `translate(${dimensions.margin.left + transform.x},${dimensions.margin.top + transform.y}) scale(${transform.k})`
          );
          setZoomLevel(transform.k);
        });

      svg.call(zoom);
    }

    // Add links
    const linkGroup = g.append('g').attr('class', 'links');

    const linkPath = sankeyLinkHorizontal();

    const linkElements = linkGroup.selectAll('.link')
      .data(sankeyGraph.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkPath)
      .style('stroke-width', (d: ProcessedLink) => Math.max(1, d.width || 0))
      .style('stroke', (d: ProcessedLink) => d.color || '#aaa')
      .style('stroke-opacity', 0.6)
      .style('fill', 'none')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d: ProcessedLink) => {
        d3.select(event.currentTarget).style('stroke-opacity', 0.8);

        onInteraction?.({
          type: 'hover',
          data: {
            source: d.source.name,
            target: d.target.name,
            value: d.value,
            percentage: (d.value / d3.sum(sankeyGraph.links, l => l.value)) * 100
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('stroke-opacity', 0.6);
      })
      .on('click', (event, d: ProcessedLink) => {
        const originalLink = links.find(link =>
          link.source === d.source.id && link.target === d.target.id
        );
        if (originalLink) {
          setSelectedLink(originalLink);
          onLinkClick?.(originalLink);
        }

        onInteraction?.({
          type: 'click',
          data: {
            source: d.source.name,
            target: d.target.name,
            value: d.value
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      });

    // Add nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeElements = nodeGroup.selectAll('.node')
      .data(sankeyGraph.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: ProcessedNode) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer');

    // Node rectangles
    nodeElements.append('rect')
      .attr('height', (d: ProcessedNode) => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', sankeyLayout.nodeWidth())
      .style('fill', (d: ProcessedNode) => d.color || '#666')
      .style('stroke', '#000')
      .style('stroke-width', 1)
      .on('mouseover', (event, d: ProcessedNode) => {
        // Highlight connected links
        linkElements
          .style('stroke-opacity', (link: ProcessedLink) =>
            link.source === d || link.target === d ? 0.8 : 0.2
          );

        const totalValue = d.value || 0;
        const incomingValue = d3.sum(sankeyGraph.links.filter(l => l.target === d), l => l.value);
        const outgoingValue = d3.sum(sankeyGraph.links.filter(l => l.source === d), l => l.value);

        onInteraction?.({
          type: 'hover',
          data: {
            name: d.name,
            category: d.category,
            totalValue,
            incomingValue,
            outgoingValue
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      })
      .on('mouseout', () => {
        linkElements.style('stroke-opacity', 0.6);
      })
      .on('click', (event, d: ProcessedNode) => {
        const originalNode = nodes.find(node => node.id === d.id);
        if (originalNode) {
          setSelectedNode(originalNode);
          onNodeClick?.(originalNode);
        }

        onInteraction?.({
          type: 'click',
          data: {
            name: d.name,
            category: d.category,
            value: d.value
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      });

    // Node labels
    if (showLabels) {
      nodeElements.append('text')
        .attr('x', -6)
        .attr('y', (d: ProcessedNode) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', '500')
        .text((d: ProcessedNode) => d.name)
        .filter((d: ProcessedNode) => (d.x0 || 0) < width / 2)
        .attr('x', sankeyLayout.nodeWidth() + 6)
        .attr('text-anchor', 'start');

      // Add value labels
      nodeElements.append('text')
        .attr('x', sankeyLayout.nodeWidth() / 2)
        .attr('y', (d: ProcessedNode) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)')
        .text((d: ProcessedNode) => formatNumber(d.value || 0, 'currency', 0));
    }

    // Add title
    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Cash Flow Analysis');

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(categories)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .style('fill', d => colorScale(d));

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 7.5)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .text(d => d);

    svgRef.current = svg.node();
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current) return;

    const options: ExportOptions = {
      format,
      filename: 'sankey-cash-flow-diagram'
    };

    try {
      await exportChart(containerRef.current, options);
      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!svgRef.current || !enableZoom) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();

    switch (direction) {
      case 'in':
        svg.transition().call(
          zoom.scaleBy as any,
          1.5
        );
        break;
      case 'out':
        svg.transition().call(
          zoom.scaleBy as any,
          1 / 1.5
        );
        break;
      case 'reset':
        svg.transition().call(
          zoom.transform as any,
          d3.zoomIdentity
        );
        setZoomLevel(1);
        break;
    }
  };

  const calculateTotalFlow = () => {
    return links.reduce((sum, link) => sum + link.value, 0);
  };

  const getFlowByCategory = () => {
    const categoryFlow = new Map<string, number>();

    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      const sourceCategory = sourceNode?.category || 'Unknown';
      const targetCategory = targetNode?.category || 'Unknown';

      const key = `${sourceCategory} → ${targetCategory}`;
      categoryFlow.set(key, (categoryFlow.get(key) || 0) + link.value);
    });

    return Array.from(categoryFlow.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  useEffect(() => {
    renderSankey();
  }, [nodes, links, showLabels, config]);

  const totalFlow = calculateTotalFlow();
  const topFlows = getFlowByCategory();

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cash Flow Analysis - Sankey Diagram</CardTitle>
          <div className="flex items-center gap-2">
            {enableZoom && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleZoom('in')}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleZoom('out')}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleZoom('reset')}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('png')}
            >
              <Download className="w-4 h-4 mr-1" />
              PNG
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('svg')}
            >
              <Download className="w-4 h-4 mr-1" />
              SVG
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-2">
          Total Flow: {formatNumber(totalFlow, 'currency', 0)}
          {enableZoom && (
            <span className="ml-4">Zoom: {Math.round(zoomLevel * 100)}%</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full overflow-hidden border rounded-lg bg-white" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {selectedNode && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Selected Node</h4>
              <div className="mt-2 space-y-1 text-sm">
                <div><span className="font-medium">Name:</span> {selectedNode.name}</div>
                <div><span className="font-medium">Category:</span> {selectedNode.category || 'N/A'}</div>
                {selectedNode.value && (
                  <div><span className="font-medium">Value:</span> {formatNumber(selectedNode.value, 'currency', 0)}</div>
                )}
              </div>
            </div>
          )}

          {selectedLink && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Selected Flow</h4>
              <div className="mt-2 space-y-1 text-sm">
                <div><span className="font-medium">From:</span> {nodes.find(n => n.id === selectedLink.source)?.name}</div>
                <div><span className="font-medium">To:</span> {nodes.find(n => n.id === selectedLink.target)?.name}</div>
                <div><span className="font-medium">Amount:</span> {formatNumber(selectedLink.value, 'currency', 0)}</div>
                <div><span className="font-medium">% of Total:</span> {formatNumber((selectedLink.value / totalFlow) * 100, 'percent', 1)}</div>
              </div>
            </div>
          )}
        </div>

        {topFlows.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Top Flow Categories</h4>
            <div className="space-y-2">
              {topFlows.map(([category, value], index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-blue-500 rounded"
                      style={{ width: `${(value / topFlows[0][1]) * 100}px` }}
                    />
                    <span className="text-sm font-bold min-w-[80px] text-right">
                      {formatNumber(value, 'currency', 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}