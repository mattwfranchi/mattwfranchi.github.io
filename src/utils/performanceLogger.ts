export const performanceLogger = {
  startTime: 0,
  marks: new Map<string, number>(),

  start() {
    this.startTime = performance.now();
    performance.mark('app_start');
  },

  mark(name: string) {
    const time = performance.now();
    this.marks.set(name, time);
    performance.mark(name);
    console.log(`[Performance] ${name}: ${(time - this.startTime).toFixed(2)}ms`);
  },

  measure(name: string, startMark: string, endMark: string) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name).pop();
      if (measure) {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      console.error(`Failed to measure ${name}:`, e);
    }
  },

  monitorFrameRate() {
    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;

    const measure = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = frames;
        console.log(`[Performance] FPS: ${fps}`);
        frames = 0;
        lastTime = currentTime;
      }

      // Log frame time
      const frameTime = currentTime - lastTime;
      if (frameTime > 16.67) { // Frames taking longer than 60fps threshold
        console.warn(`[Performance] Slow frame: ${frameTime.toFixed(2)}ms`);
      }

      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  },

  async getGPUInfo() {
    if ('gpu' in navigator) {
      try {
        // @ts-ignore - Experimental API
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          console.log('[GPU] Info:', {
            name: adapter.name,
            description: adapter.description,
          });
        }
      } catch (e) {
        console.log('[GPU] WebGPU not available');
      }
    }
  }
};