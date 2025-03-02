import { perfLog } from './performanceUtils';

interface PerformanceData {
  fps: number[];
  memoryUsage: number[];
  frameTimings: number[];
  events: Array<{time: number, event: string, duration?: number}>;
}

export const performanceLogger = {
  startTime: 0,
  marks: new Map<string, number>(),
  data: {
    fps: [],
    memoryUsage: [],
    frameTimings: [],
    events: []
  } as PerformanceData,
  
  // Track current FPS for real-time adaptation
  currentFPS: 60,
  
  // Initialize the logger
  start() {
    this.startTime = performance.now();
    performance.mark('app_start');
    this.data.events.push({time: 0, event: 'app_start'});
    this.monitorMemory();
  },

  // Record a performance mark
  mark(name: string) {
    const time = performance.now();
    const relativeTime = time - this.startTime;
    this.marks.set(name, time);
    performance.mark(name);
    this.data.events.push({time: relativeTime, event: name});
    perfLog('log', `${name}: ${relativeTime.toFixed(2)}ms`);
  },

  // Measure time between marks
  measure(name: string, startMark: string, endMark: string) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure').pop();
      if (measure) {
        perfLog('log', `${name}: ${measure.duration.toFixed(2)}ms`);
        this.data.events.push({
          time: measure.startTime - this.startTime,
          event: name,
          duration: measure.duration
        });
      }
    } catch (e) {
      perfLog('error', `Failed to measure ${name}:`, e);
    }
  },

  // Monitor frame rate continuously
  monitorFrameRate() {
    let lastTime = performance.now();
    let frames = 0;
    let frameTimesSum = 0;
    let slowFrames = 0;
    
    // Function to detect slowdowns
    const checkThrottling = (fps: number, avgFrameTime: number) => {
      if (slowFrames >= 5) {
        perfLog('warn', `Performance warning: ${slowFrames} slow frames detected. Avg frame time: ${avgFrameTime.toFixed(2)}ms, FPS: ${fps}`);
      }
      
      // Reset counter
      slowFrames = 0;
    };

    const measureFrame = () => {
      frames++;
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      
      // Track frame timing
      this.data.frameTimings.push(frameTime);
      if (this.data.frameTimings.length > 300) this.data.frameTimings.shift();
      
      frameTimesSum += frameTime;
      
      // Log frame time if it's too slow (less than 30fps)
      if (frameTime > 33.33) {
        slowFrames++;
        if (frameTime > 100) {
          // This is a very slow frame, log it immediately
          perfLog('warn', `Very slow frame: ${frameTime.toFixed(2)}ms`);
        }
      }
      
      // Calculate FPS every second
      if (currentTime >= lastTime + 1000) {
        const fps = frames;
        const avgFrameTime = frameTimesSum / frames;
        
        // Update current FPS for other utilities to reference
        this.currentFPS = fps;
        
        // Log current performance
        perfLog('log', `FPS: ${fps}, Avg frame: ${avgFrameTime.toFixed(2)}ms`);
        
        // Store the data
        this.data.fps.push(fps);
        if (this.data.fps.length > 60) this.data.fps.shift();
        
        // Check for throttling
        checkThrottling(fps, avgFrameTime);
        
        // Reset counters
        frames = 0;
        frameTimesSum = 0;
        lastTime = currentTime;
      }

      lastTime = currentTime;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  },
  
  // Monitor memory usage if available
  monitorMemory() {
    // Skip if memory API is not available
    if (!performance.memory) return;
    
    const checkMemory = () => {
      // TypeScript doesn't know about non-standard performance.memory
      const memory = (performance as any).memory;
      
      if (memory) {
        const usedHeapMB = memory.usedJSHeapSize / (1024 * 1024);
        const totalHeapMB = memory.totalJSHeapSize / (1024 * 1024);
        this.data.memoryUsage.push(usedHeapMB);
        
        // Keep only the last 60 readings
        if (this.data.memoryUsage.length > 60) this.data.memoryUsage.shift();
        
        // Check for memory growth
        const recentReadings = this.data.memoryUsage.slice(-20);
        if (recentReadings.length >= 20) {
          const firstAvg = recentReadings.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5;
          const lastAvg = recentReadings.slice(-5).reduce((sum, val) => sum + val, 0) / 5;
          
          // If memory is continuously growing, warn about a possible leak
          if (lastAvg > firstAvg * 1.3) {
            perfLog('warn', `Potential memory leak detected: Memory grew from ${firstAvg.toFixed(1)}MB to ${lastAvg.toFixed(1)}MB`);
          }
        }
        
        // Log every 5th reading
        if (this.data.memoryUsage.length % 5 === 0) {
          perfLog('log', `Memory usage: ${usedHeapMB.toFixed(1)}MB / ${totalHeapMB.toFixed(1)}MB`);
        }
      }
      
      // Check again in 1 second
      setTimeout(checkMemory, 1000);
    };
    
    setTimeout(checkMemory, 1000);
  },

  // Get information about GPU if available
  async getGPUInfo() {
    // Try to get GPU info from navigator
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          
          perfLog('log', 'GPU Info:', { vendor, renderer });
          return { vendor, renderer };
        }
      }
    } catch (e) {
      perfLog('log', 'Could not retrieve GPU info', e);
    }
    
    return null;
  },
  
  // Get a summary of performance metrics
  getSummary() {
    // Calculate average FPS
    const avgFPS = this.data.fps.reduce((sum, val) => sum + val, 0) / 
                   Math.max(1, this.data.fps.length);
    
    // Calculate frame time stats
    const frameTimes = this.data.frameTimings;
    const avgFrameTime = frameTimes.reduce((sum, val) => sum + val, 0) / 
                         Math.max(1, frameTimes.length);
    
    const maxFrameTime = Math.max(...frameTimes);
    
    // Calculate 95th percentile frame time (indicating stutters)
    const sortedFrameTimes = [...frameTimes].sort((a, b) => a - b);
    const idx95 = Math.floor(sortedFrameTimes.length * 0.95);
    const percentile95 = sortedFrameTimes[idx95] || 0;
    
    return {
      averageFPS: avgFPS,
      currentFPS: this.currentFPS,
      averageFrameTime: avgFrameTime,
      maxFrameTime,
      frameTimePercentile95: percentile95,
      memoryUsage: this.data.memoryUsage.length > 0 ? 
                   this.data.memoryUsage[this.data.memoryUsage.length - 1] : null,
      totalRunTime: (performance.now() - this.startTime) / 1000  // In seconds
    };
  }
};