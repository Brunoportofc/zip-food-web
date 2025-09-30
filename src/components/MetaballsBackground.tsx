'use client';

import { useEffect, useRef } from 'react';

interface MetaballsBackgroundProps {
  className?: string;
}

export default function MetaballsBackground({ className = '' }: MetaballsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    const numMetaballs = 25;
    const metaballs: Array<{x: number, y: number, vx: number, vy: number, r: number}> = [];

    // Initialize metaballs
    for (let i = 0; i < numMetaballs; i++) {
      const radius = Math.random() * 60 + 30; // Increased size: 30-90 instead of 15-55
      metaballs.push({
        x: Math.random() * (width - 2 * radius) + radius,
        y: Math.random() * (height - 2 * radius) + radius,
        vx: (Math.random() - 0.5) * 1.5, // Slightly slower movement
        vy: (Math.random() - 0.5) * 1.5,
        r: radius * 0.85 // Increased effective radius
      });
    }

    // Vertex shader
    const vertexShaderSrc = `
      attribute vec2 position;
      
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader with green colors
    const fragmentShaderSrc = `
      precision highp float;
      
      const float WIDTH = ${width.toFixed(1)};
      const float HEIGHT = ${height.toFixed(1)};
      
      uniform vec3 metaballs[${numMetaballs}];
      
      void main(){
        float x = gl_FragCoord.x;
        float y = gl_FragCoord.y;
        
        float sum = 0.0;
        for (int i = 0; i < ${numMetaballs}; i++) {
          vec3 metaball = metaballs[i];
          float dx = metaball.x - x;
          float dy = metaball.y - y;
          float radius = metaball.z;
          
          sum += (radius * radius) / (dx * dx + dy * dy);
        }
        
        if (sum >= 0.99) {
          // Predominantly blue color palette
          vec3 lightBlue = vec3(0.4, 0.8, 1.0);       // Light blue #66CCFF
          vec3 skyBlue = vec3(0.2, 0.6, 1.0);         // Sky blue #3399FF
          vec3 oceanBlue = vec3(0.0, 0.4, 1.0);       // Ocean blue #0066FF
          vec3 deepBlue = vec3(0.0, 0.2, 0.8);        // Deep blue #0033CC
          vec3 navyBlue = vec3(0.0, 0.1, 0.6);        // Navy blue #001999
          
          float intensity = max(0.0, 1.0 - (sum - 0.99) * 50.0);
          
          // Create multi-dimensional gradient based on position and time
          float gradientX = x / WIDTH;
          float gradientY = y / HEIGHT;
          float time = sin(x * 0.002 + y * 0.002) * 0.5 + 0.5;
          
          // Complex gradient mixing for depth and visual appeal
          vec3 color;
          float mixFactor = (gradientX + gradientY) * 0.5;
          
          if (mixFactor < 0.25) {
            // Light blue to sky blue transition
            color = mix(lightBlue, skyBlue, mixFactor * 4.0);
          } else if (mixFactor < 0.5) {
            // Sky blue to ocean blue transition
            color = mix(skyBlue, oceanBlue, (mixFactor - 0.25) * 4.0);
          } else if (mixFactor < 0.75) {
            // Ocean blue to deep blue transition
            color = mix(oceanBlue, deepBlue, (mixFactor - 0.5) * 4.0);
          } else {
            // Deep blue to navy blue transition
            color = mix(deepBlue, navyBlue, (mixFactor - 0.75) * 4.0);
          }
          
          // Apply pure color without depth effects
          gl_FragColor = vec4(color, intensity);
          return;
        }
        
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent background
      }
    `;

    // Compile shader function
    function compileShader(shaderSource: string, shaderType: number) {
      const shader = gl.createShader(shaderType);
      if (!shader) throw new Error('Could not create shader');
      
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Shader compile failed: ' + error);
      }

      return shader;
    }

    // Get uniform location function
    function getUniformLocation(program: WebGLProgram, name: string) {
      const uniformLocation = gl.getUniformLocation(program, name);
      if (uniformLocation === -1) {
        throw new Error('Cannot find uniform ' + name);
      }
      return uniformLocation;
    }

    // Get attribute location function
    function getAttribLocation(program: WebGLProgram, name: string) {
      const attributeLocation = gl.getAttribLocation(program, name);
      if (attributeLocation === -1) {
        throw new Error('Cannot find attribute ' + name);
      }
      return attributeLocation;
    }

    try {
      // Create and link program
      const vertexShader = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
      const fragmentShader = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

      const program = gl.createProgram();
      if (!program) throw new Error('Could not create program');

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
      }

      gl.useProgram(program);

      // Set up vertex data
      const vertexData = new Float32Array([
        -1.0,  1.0, // top left
        -1.0, -1.0, // bottom left
         1.0,  1.0, // top right
         1.0, -1.0, // bottom right
      ]);

      const vertexDataBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

      const positionHandle = getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionHandle);
      gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 2 * 4, 0);

      const metaballsHandle = getUniformLocation(program, 'metaballs');

      // Enable blending for transparency
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Animation loop
      function loop() {
        // Update metaballs
        for (let i = 0; i < numMetaballs; i++) {
          const metaball = metaballs[i];
          metaball.x += metaball.vx;
          metaball.y += metaball.vy;

          if (metaball.x < metaball.r || metaball.x > width - metaball.r) metaball.vx *= -1;
          if (metaball.y < metaball.r || metaball.y > height - metaball.r) metaball.vy *= -1;
        }

        // Send data to GPU
        const dataToSendToGPU = new Float32Array(3 * numMetaballs);
        for (let i = 0; i < numMetaballs; i++) {
          const baseIndex = 3 * i;
          const mb = metaballs[i];
          dataToSendToGPU[baseIndex + 0] = mb.x;
          dataToSendToGPU[baseIndex + 1] = mb.y;
          dataToSendToGPU[baseIndex + 2] = mb.r;
        }
        gl.uniform3fv(metaballsHandle, dataToSendToGPU);

        // Clear and draw
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationRef.current = requestAnimationFrame(loop);
      }

      loop();

    } catch (error) {
      console.error('WebGL setup failed:', error);
    }

    // Handle resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (gl) {
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ 
        width: '100vw', 
        height: '100vh',
        opacity: 0.9
      }}
    />
  );
}