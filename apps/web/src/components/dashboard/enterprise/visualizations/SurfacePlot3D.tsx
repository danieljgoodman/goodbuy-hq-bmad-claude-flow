/**
 * 3D Surface Plot Component for Multi-Variable Optimization
 * Uses Three.js for 3D rendering with D3.js for data processing
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type {
  SurfacePlotData,
  VisualizationProps,
  ChartInteraction,
  ExportOptions
} from '@/lib/types/visualization';
import {
  formatNumber,
  exportChart,
  COLOR_SCHEMES
} from '@/lib/utils/visualization-helpers';

interface SurfacePlot3DProps extends Omit<VisualizationProps, 'data'> {
  data: SurfacePlotData[];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  colorScale?: 'viridis' | 'plasma' | 'cool' | 'warm';
  showWireframe?: boolean;
  onOptimumFound?: (point: SurfacePlotData) => void;
}

export function SurfacePlot3D({
  data,
  config,
  xLabel = 'X Variable',
  yLabel = 'Y Variable',
  zLabel = 'Z Objective',
  colorScale = 'viridis',
  showWireframe = false,
  onInteraction,
  onExport,
  onOptimumFound,
  className = '',
  testId = 'surface-plot-3d'
}: SurfacePlot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isRotating, setIsRotating] = useState(true);
  const [zoom, setZoom] = useState([50]);
  const [opacity, setOpacity] = useState([0.8]);
  const [selectedPoint, setSelectedPoint] = useState<SurfacePlotData | null>(null);

  // Create color scale function
  const getColorScale = (scale: string) => {
    switch (scale) {
      case 'viridis':
        return d3.scaleSequential(d3.interpolateViridis);
      case 'plasma':
        return d3.scaleSequential(d3.interpolatePlasma);
      case 'cool':
        return d3.scaleSequential(d3.interpolateCool);
      case 'warm':
        return d3.scaleSequential(d3.interpolateWarm);
      default:
        return d3.scaleSequential(d3.interpolateViridis);
    }
  };

  // Initialize Three.js scene
  const initializeScene = () => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = Math.min(600, width * 0.6);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Controls (basic rotation)
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      mouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown || !camera) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Raycaster for picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          // Find closest data point
          const closest = data.reduce((prev, curr) => {
            const prevDist = Math.abs(prev.x - point.x) + Math.abs(prev.y - point.z) + Math.abs(prev.z - point.y);
            const currDist = Math.abs(curr.x - point.x) + Math.abs(curr.y - point.z) + Math.abs(curr.z - point.y);
            return currDist < prevDist ? curr : prev;
          });

          setSelectedPoint(closest);
          onInteraction?.({
            type: 'click',
            data: closest,
            position: { x: event.clientX, y: event.clientY },
            element: renderer.domElement
          });
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onMouseClick);
    };
  };

  // Create surface mesh from data
  const createSurface = () => {
    if (!sceneRef.current || data.length === 0) return;

    // Remove existing mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
    }

    // Process data to create grid
    const xValues = [...new Set(data.map(d => d.x))].sort((a, b) => a - b);
    const yValues = [...new Set(data.map(d => d.y))].sort((a, b) => a - b);
    const zExtent = d3.extent(data, d => d.z) as [number, number];

    const gridWidth = xValues.length;
    const gridHeight = yValues.length;

    // Create geometry
    const geometry = new THREE.PlaneGeometry(10, 10, gridWidth - 1, gridHeight - 1);
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    // Color scale
    const colorScaleFunc = getColorScale(colorScale);
    colorScaleFunc.domain(zExtent);

    // Map data to vertices
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        const dataPoint = data.find(d =>
          Math.abs(d.x - xValues[j]) < 0.001 && Math.abs(d.y - yValues[i]) < 0.001
        );

        const vertexIndex = i * gridWidth + j;
        const positionIndex = vertexIndex * 3;

        if (dataPoint) {
          // Set position (map to -5 to 5 range)
          positions[positionIndex] = (j / (gridWidth - 1)) * 10 - 5;
          positions[positionIndex + 1] = ((dataPoint.z - zExtent[0]) / (zExtent[1] - zExtent[0])) * 5;
          positions[positionIndex + 2] = (i / (gridHeight - 1)) * 10 - 5;

          // Set color
          const color = d3.color(colorScaleFunc((dataPoint.z - zExtent[0]) / (zExtent[1] - zExtent[0])));
          if (color) {
            const rgb = d3.rgb(color);
            colors[positionIndex] = rgb.r / 255;
            colors[positionIndex + 1] = rgb.g / 255;
            colors[positionIndex + 2] = rgb.b / 255;
          }
        }
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Create material
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: opacity[0],
      wireframe: showWireframe,
      side: THREE.DoubleSide
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Add axes
    addAxes();

    // Find and highlight optimum
    const optimum = data.reduce((prev, curr) => curr.z > prev.z ? curr : prev);
    onOptimumFound?.(optimum);
    addOptimumMarker(optimum, xValues, yValues, zExtent);
  };

  // Add coordinate axes
  const addAxes = () => {
    if (!sceneRef.current) return;

    const axesGroup = new THREE.Group();

    // X axis (red)
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-6, -2, 0),
      new THREE.Vector3(6, -2, 0)
    ]);
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const xLine = new THREE.Line(xGeometry, xMaterial);
    axesGroup.add(xLine);

    // Y axis (green)
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -2, -6),
      new THREE.Vector3(0, -2, 6)
    ]);
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const yLine = new THREE.Line(yGeometry, yMaterial);
    axesGroup.add(yLine);

    // Z axis (blue)
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-6, -2, 0),
      new THREE.Vector3(-6, 8, 0)
    ]);
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const zLine = new THREE.Line(zGeometry, zMaterial);
    axesGroup.add(zLine);

    sceneRef.current.add(axesGroup);
  };

  // Add marker for optimum point
  const addOptimumMarker = (
    optimum: SurfacePlotData,
    xValues: number[],
    yValues: number[],
    zExtent: [number, number]
  ) => {
    if (!sceneRef.current) return;

    const xIndex = xValues.indexOf(optimum.x);
    const yIndex = yValues.indexOf(optimum.y);

    const x = (xIndex / (xValues.length - 1)) * 10 - 5;
    const z = (yIndex / (yValues.length - 1)) * 10 - 5;
    const y = ((optimum.z - zExtent[0]) / (zExtent[1] - zExtent[0])) * 5;

    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y + 0.5, z);
    sceneRef.current.add(sphere);
  };

  // Animation loop
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    if (isRotating && meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle zoom
  useEffect(() => {
    if (cameraRef.current) {
      const distance = 10 + (100 - zoom[0]) * 0.5;
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(cameraRef.current.position);
      spherical.radius = distance;
      cameraRef.current.position.setFromSpherical(spherical);
    }
  }, [zoom]);

  // Handle opacity
  useEffect(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshLambertMaterial;
      material.opacity = opacity[0];
    }
  }, [opacity]);

  // Export functionality
  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current || !rendererRef.current) return;

    const options: ExportOptions = {
      format,
      filename: 'surface-plot-3d'
    };

    try {
      if (format === 'png' || format === 'pdf') {
        // For 3D plots, we'll export the canvas directly
        const canvas = rendererRef.current.domElement;
        const dataURL = canvas.toDataURL('image/png');

        if (format === 'png') {
          const link = document.createElement('a');
          link.download = `${options.filename}.png`;
          link.href = dataURL;
          link.click();
        } else {
          // Convert to PDF using jsPDF
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF();
          pdf.addImage(dataURL, 'PNG', 10, 10, 180, 120);
          pdf.save(`${options.filename}.pdf`);
        }
      }

      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(20, 20, 20);
      cameraRef.current.lookAt(0, 0, 0);
    }
    setZoom([50]);
    setIsRotating(true);
  };

  // Initialize and cleanup
  useEffect(() => {
    const cleanup = initializeScene();
    animate();

    return () => {
      cleanup?.();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    createSurface();
  }, [data, showWireframe, colorScale]);

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>3D Surface Plot - Multi-Variable Optimization</CardTitle>
          <div className="flex items-center gap-2">
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
              onClick={() => handleExport('pdf')}
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetView}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isRotating ? "default" : "outline"}
              onClick={() => setIsRotating(!isRotating)}
            >
              {isRotating ? 'Stop Rotation' : 'Start Rotation'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4" />
            <div className="w-24">
              <Slider
                value={zoom}
                onValueChange={setZoom}
                max={100}
                min={10}
                step={5}
              />
            </div>
            <ZoomIn className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Opacity:</label>
            <div className="w-20">
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={1}
                min={0.1}
                step={0.1}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full border rounded-lg bg-gray-50" />

        {selectedPoint && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">Selected Point</h4>
            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="font-medium">{xLabel}:</span> {formatNumber(selectedPoint.x, 'decimal', 2)}
              </div>
              <div>
                <span className="font-medium">{yLabel}:</span> {formatNumber(selectedPoint.y, 'decimal', 2)}
              </div>
              <div>
                <span className="font-medium">{zLabel}:</span> {formatNumber(selectedPoint.z, 'decimal', 2)}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span>{xLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span>{yLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span>{zLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Optimum</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}