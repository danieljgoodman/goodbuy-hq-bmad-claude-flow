/**
 * Network Graph Component for Business Relationships
 * Force-directed graph showing connections between entities
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, Play, Pause, RotateCcw, Search } from 'lucide-react';
import type {
  NetworkNode,
  NetworkLink,
  VisualizationProps,
  ChartInteraction,
  ExportOptions
} from '@/lib/types/visualization';
import {
  createSVG,
  formatNumber,
  exportChart,
  COLOR_SCHEMES,
  DEFAULT_DIMENSIONS,
  debounce
} from '@/lib/utils/visualization-helpers';

interface NetworkGraphProps extends Omit<VisualizationProps, 'data'> {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick?: (node: NetworkNode) => void;
  onLinkClick?: (link: NetworkLink) => void;
  showLabels?: boolean;
  enableSearch?: boolean;
  layoutStrength?: number;
}

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
  radius: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: SimulationNode;
  target: SimulationNode;
  value: number;
  type?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export function NetworkGraph({
  nodes,
  links,
  config,
  onInteraction,
  onExport,
  onNodeClick,
  onLinkClick,
  showLabels = true,
  enableSearch = true,
  layoutStrength = 1,
  className = '',
  testId = 'network-graph'
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);

  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [forceStrength, setForceStrength] = useState([layoutStrength * 100]);
  const [linkDistance, setLinkDistance] = useState([50]);

  // Filter nodes and links based on search
  const filteredData = React.useMemo(() => {
    if (!searchTerm) {
      return { nodes, links };
    }

    const searchLower = searchTerm.toLowerCase();
    const matchingNodeIds = new Set(
      nodes
        .filter(node =>
          node.name.toLowerCase().includes(searchLower) ||
          node.group.toLowerCase().includes(searchLower)
        )
        .map(node => node.id)
    );

    const filteredNodes = nodes.filter(node => matchingNodeIds.has(node.id));
    const filteredLinks = links.filter(link =>
      matchingNodeIds.has(link.source) && matchingNodeIds.has(link.target)
    );

    setHighlightedNodes(matchingNodeIds);

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchTerm]);

  const renderNetwork = () => {
    if (!containerRef.current || filteredData.nodes.length === 0) return;

    const container = d3.select(containerRef.current);
    container.select('svg').remove();

    const dimensions = config.dimensions || {
      ...DEFAULT_DIMENSIONS,
      width: 800,
      height: 600
    };

    const svg = createSVG(container, dimensions, 'network-graph-svg');

    const width = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const height = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Create scales
    const groups = [...new Set(filteredData.nodes.map(n => n.group))];
    const colorScale = d3.scaleOrdinal(COLOR_SCHEMES.categorical).domain(groups);

    const valueExtent = d3.extent(filteredData.nodes, d => d.value) as [number, number];
    const radiusScale = d3.scaleLinear()
      .domain(valueExtent)
      .range([5, 25]);

    // Prepare simulation data
    const simulationNodes: SimulationNode[] = filteredData.nodes.map(node => ({
      ...node,
      radius: radiusScale(node.value),
      color: node.color || colorScale(node.group)
    }));

    const simulationLinks: SimulationLink[] = filteredData.links.map(link => ({
      ...link,
      source: simulationNodes.find(n => n.id === link.source)!,
      target: simulationNodes.find(n => n.id === link.target)!
    }));

    // Create force simulation
    const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(simulationLinks)
        .id(d => d.id)
        .distance(linkDistance[0])
        .strength(forceStrength[0] / 100)
      )
      .force('charge', d3.forceManyBody()
        .strength(-300 * forceStrength[0] / 100)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimulationNode>()
        .radius(d => d.radius + 2)
      );

    simulationRef.current = simulation;

    // Create link strength scale
    const linkValueExtent = d3.extent(simulationLinks, d => d.value) as [number, number];
    const linkWidthScale = d3.scaleLinear()
      .domain(linkValueExtent)
      .range([1, 8]);

    const linkOpacityScale = d3.scaleLinear()
      .domain(linkValueExtent)
      .range([0.3, 0.8]);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform',
          `translate(${dimensions.margin.left + event.transform.x},${dimensions.margin.top + event.transform.y}) scale(${event.transform.k})`
        );
      });

    svg.call(zoom);

    // Create arrow markers for directed links
    const defs = svg.append('defs');

    groups.forEach(group => {
      defs.append('marker')
        .attr('id', `arrow-${group}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .style('fill', colorScale(group));
    });

    // Add links
    const linkGroup = g.append('g').attr('class', 'links');

    const linkElements = linkGroup.selectAll('.link')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .style('stroke', d => d.color || '#999')
      .style('stroke-width', d => linkWidthScale(d.value))
      .style('stroke-opacity', d => linkOpacityScale(d.value))
      .style('cursor', 'pointer')
      .attr('marker-end', d => `url(#arrow-${d.target.group})`)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .style('stroke-width', linkWidthScale(d.value) + 2)
          .style('stroke-opacity', 1);

        onInteraction?.({
          type: 'hover',
          data: {
            source: d.source.name,
            target: d.target.name,
            value: d.value,
            type: d.type
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget)
          .style('stroke-width', linkWidthScale(d.value))
          .style('stroke-opacity', linkOpacityScale(d.value));
      })
      .on('click', (event, d) => {
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
      .data(simulationNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, SimulationNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    nodeElements.append('circle')
      .attr('r', d => d.radius)
      .style('fill', d => d.color!)
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('opacity', d => highlightedNodes.size === 0 || highlightedNodes.has(d.id) ? 1 : 0.3)
      .on('mouseover', (event, d) => {
        // Highlight connected nodes and links
        const connectedNodeIds = new Set<string>();
        connectedNodeIds.add(d.id);

        simulationLinks.forEach(link => {
          if (link.source.id === d.id || link.target.id === d.id) {
            connectedNodeIds.add(link.source.id);
            connectedNodeIds.add(link.target.id);
          }
        });

        nodeElements.selectAll('circle')
          .style('opacity', node => connectedNodeIds.has(node.id) ? 1 : 0.2);

        linkElements
          .style('stroke-opacity', link =>
            link.source.id === d.id || link.target.id === d.id ? 1 : 0.1
          );

        onInteraction?.({
          type: 'hover',
          data: {
            name: d.name,
            group: d.group,
            value: d.value,
            connections: simulationLinks.filter(l => l.source.id === d.id || l.target.id === d.id).length
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      })
      .on('mouseout', () => {
        nodeElements.selectAll('circle')
          .style('opacity', d => highlightedNodes.size === 0 || highlightedNodes.has(d.id) ? 1 : 0.3);

        linkElements.style('stroke-opacity', d => linkOpacityScale(d.value));
      })
      .on('click', (event, d) => {
        const originalNode = nodes.find(node => node.id === d.id);
        if (originalNode) {
          setSelectedNode(originalNode);
          onNodeClick?.(originalNode);
        }

        onInteraction?.({
          type: 'click',
          data: {
            name: d.name,
            group: d.group,
            value: d.value
          },
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      });

    // Node labels
    if (showLabels) {
      nodeElements.append('text')
        .attr('dx', d => d.radius + 5)
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text(d => d.name)
        .style('opacity', d => highlightedNodes.size === 0 || highlightedNodes.has(d.id) ? 1 : 0.3);
    }

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => d.source.x!)
        .attr('y1', d => d.source.y!)
        .attr('x2', d => d.target.x!)
        .attr('y2', d => d.target.y!);

      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Control simulation state
    if (!isSimulating) {
      simulation.stop();
    }

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(groups)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItems.append('circle')
      .attr('r', 8)
      .style('fill', d => colorScale(d));

    legendItems.append('text')
      .attr('x', 15)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .text(d => d);

    svgRef.current = svg.node();
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current) return;

    const options: ExportOptions = {
      format,
      filename: 'network-graph-business-relationships'
    };

    try {
      await exportChart(containerRef.current, options);
      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const restartSimulation = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
      setIsSimulating(true);
    }
  };

  const toggleSimulation = () => {
    if (simulationRef.current) {
      if (isSimulating) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
      setIsSimulating(!isSimulating);
    }
  };

  // Update force parameters
  useEffect(() => {
    if (simulationRef.current) {
      const linkForce = simulationRef.current.force('link') as d3.ForceLink<SimulationNode, SimulationLink>;
      const chargeForce = simulationRef.current.force('charge') as d3.ForceManyBody<SimulationNode>;

      if (linkForce) {
        linkForce.distance(linkDistance[0]).strength(forceStrength[0] / 100);
      }
      if (chargeForce) {
        chargeForce.strength(-300 * forceStrength[0] / 100);
      }

      simulationRef.current.alpha(0.3).restart();
    }
  }, [forceStrength, linkDistance]);

  // Debounced search
  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term);
  }, 300);

  useEffect(() => {
    renderNetwork();
  }, [filteredData, showLabels, config]);

  const getNetworkStats = () => {
    const nodeCount = filteredData.nodes.length;
    const linkCount = filteredData.links.length;
    const density = linkCount / (nodeCount * (nodeCount - 1) / 2);
    const avgConnections = linkCount * 2 / nodeCount;

    return { nodeCount, linkCount, density, avgConnections };
  };

  const stats = getNetworkStats();

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Relationship Network</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isSimulating ? "default" : "outline"}
              onClick={toggleSimulation}
            >
              {isSimulating ? (
                <Pause className="w-4 h-4 mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {isSimulating ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={restartSimulation}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart
            </Button>
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

        <div className="flex items-center gap-4 mt-4">
          {enableSearch && (
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search nodes..."
                className="text-sm border rounded px-2 py-1 w-40"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Force:</label>
            <div className="w-20">
              <Slider
                value={forceStrength}
                onValueChange={setForceStrength}
                max={200}
                min={10}
                step={10}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Distance:</label>
            <div className="w-20">
              <Slider
                value={linkDistance}
                onValueChange={setLinkDistance}
                max={150}
                min={20}
                step={10}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full border rounded-lg bg-gray-50" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.nodeCount}
            </div>
            <div className="text-sm text-gray-600">Nodes</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.linkCount}
            </div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(stats.density, 'decimal', 3)}
            </div>
            <div className="text-sm text-gray-600">Density</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(stats.avgConnections, 'decimal', 1)}
            </div>
            <div className="text-sm text-gray-600">Avg Connections</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {selectedNode && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Selected Node</h4>
              <div className="mt-2 space-y-1 text-sm">
                <div><span className="font-medium">Name:</span> {selectedNode.name}</div>
                <div><span className="font-medium">Group:</span> {selectedNode.group}</div>
                <div><span className="font-medium">Value:</span> {formatNumber(selectedNode.value, 'decimal', 0)}</div>
                <div>
                  <span className="font-medium">Connections:</span>{' '}
                  {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length}
                </div>
              </div>
            </div>
          )}

          {selectedLink && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Selected Connection</h4>
              <div className="mt-2 space-y-1 text-sm">
                <div><span className="font-medium">From:</span> {nodes.find(n => n.id === selectedLink.source)?.name}</div>
                <div><span className="font-medium">To:</span> {nodes.find(n => n.id === selectedLink.target)?.name}</div>
                <div><span className="font-medium">Strength:</span> {formatNumber(selectedLink.value, 'decimal', 2)}</div>
                <div><span className="font-medium">Type:</span> {selectedLink.type || 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}