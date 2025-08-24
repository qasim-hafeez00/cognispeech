import React, { useEffect, useRef, useCallback, DependencyList } from 'react';
import * as d3 from 'd3';

export type D3RenderFunction<T = d3.Selection<SVGSVGElement, unknown, null, undefined>> = (
  selection: T,
) => void | (() => void);

/**
 * Custom hook for integrating D3.js with React components.
 * Provides a clean separation between React's declarative rendering and D3's imperative DOM manipulation.
 * 
 * @param renderFn - Function that renders the D3 visualization
 * @param deps - Dependencies that should trigger a re-render
 * @returns Ref object to attach to the SVG element
 */
export const useD3 = <T extends Element = SVGSVGElement>(
  renderFn: D3RenderFunction<d3.Selection<T, unknown, null, undefined>>,
  deps: DependencyList = [],
): React.RefObject<T> => {
  const ref = useRef<T>(null);

  const render = useCallback(() => {
    if (ref.current) {
      const selection = d3.select(ref.current);
      const cleanup = renderFn(selection);
      
      // Return cleanup function if provided
      return cleanup;
    }
  }, [renderFn]);

  useEffect(() => {
    const cleanup = render();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [render, ...deps]);

  return ref;
};

/**
 * Enhanced D3 hook that provides both the ref and the current D3 selection.
 * Useful when you need to access the D3 selection outside of the render function.
 */
export const useD3Selection = <T extends Element = SVGSVGElement>(
  deps: DependencyList = [],
): {
  ref: React.RefObject<T>;
  selection: d3.Selection<T, unknown, null, undefined> | null;
} => {
  const ref = useRef<T>(null);
  const [selection, setSelection] = React.useState<d3.Selection<T, unknown, null, undefined> | null>(null);

  useEffect(() => {
    if (ref.current) {
      const d3Selection = d3.select(ref.current);
      setSelection(d3Selection);
    }
  }, [ref.current, ...deps]);

  return { ref, selection };
};

/**
 * Hook for creating responsive D3 charts that automatically resize with their container.
 * 
 * @param renderFn - Function that renders the D3 visualization
 * @param deps - Dependencies that should trigger a re-render
 * @returns Ref object and resize observer
 */
export const useResponsiveD3 = <T extends Element = SVGSVGElement>(
  renderFn: D3RenderFunction<d3.Selection<T, unknown, null, undefined>>,
  deps: DependencyList = [],
): {
  ref: React.RefObject<T>;
  resizeObserver: ResizeObserver | null;
} => {
  const ref = useRef<T>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const render = useCallback(() => {
    if (ref.current) {
      const selection = d3.select(ref.current);
      renderFn(selection);
    }
  }, [renderFn]);

  useEffect(() => {
    if (ref.current) {
      // Create resize observer
      const resizeObserver = new ResizeObserver(() => {
        render();
      });

      resizeObserver.observe(ref.current);
      resizeObserverRef.current = resizeObserver;

      // Initial render
      render();

      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
      };
    }
    return undefined;
  }, [render, ...deps]);

  return { ref, resizeObserver: resizeObserverRef.current };
};

/**
 * Hook for creating animated D3 transitions with proper cleanup.
 * 
 * @param renderFn - Function that renders the D3 visualization with transitions
 * @param deps - Dependencies that should trigger a re-render
 * @returns Ref object and transition control functions
 */
export const useAnimatedD3 = <T extends Element = SVGSVGElement>(
  renderFn: D3RenderFunction<d3.Selection<T, unknown, null, undefined>>,
  deps: DependencyList = [],
): {
  ref: React.RefObject<T>;
  stopTransitions: () => void;
  isTransitioning: boolean;
} => {
  const ref = useRef<T>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const stopTransitions = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const render = useCallback(() => {
    if (ref.current) {
      const selection = d3.select(ref.current);
      renderFn(selection);
    }
  }, [renderFn]);

  useEffect(() => {
    render();
    
    return () => {
      stopTransitions();
    };
  }, [render, stopTransitions, ...deps]);

  return { ref, stopTransitions, isTransitioning };
};

/**
 * Hook for creating interactive D3 charts with event handling.
 * 
 * @param renderFn - Function that renders the D3 visualization
 * @param eventHandlers - Object containing event handler functions
 * @param deps - Dependencies that should trigger a re-render
 * @returns Ref object and event control functions
 */
export const useInteractiveD3 = <T extends Element = SVGSVGElement>(
  renderFn: D3RenderFunction<d3.Selection<T, unknown, null, undefined>>,
  eventHandlers: {
    onClick?: (event: MouseEvent, d: any) => void;
    onHover?: (event: MouseEvent, d: any) => void;
    onMouseOut?: (event: MouseEvent, d: any) => void;
  } = {},
  deps: DependencyList = [],
): {
  ref: React.RefObject<T>;
  addEventListeners: (selection: d3.Selection<any, any, any, any>) => void;
  removeEventListeners: (selection: d3.Selection<any, any, any, any>) => void;
} => {
  const ref = useRef<T>(null);

  const addEventListeners = useCallback((selection: d3.Selection<any, any, any, any>) => {
    if (eventHandlers.onClick) {
      selection.on('click', eventHandlers.onClick);
    }
    if (eventHandlers.onHover) {
      selection.on('mouseover', eventHandlers.onHover);
    }
    if (eventHandlers.onMouseOut) {
      selection.on('mouseout', eventHandlers.onMouseOut);
    }
  }, [eventHandlers]);

  const removeEventListeners = useCallback((selection: d3.Selection<any, any, any, any>) => {
    selection.on('click', null);
    selection.on('mouseover', null);
    selection.on('mouseout', null);
  }, []);

  const render = useCallback(() => {
    if (ref.current) {
      const selection = d3.select(ref.current);
      renderFn(selection);
    }
  }, [renderFn]);

  useEffect(() => {
    render();
  }, [render, ...deps]);

  return { ref, addEventListeners, removeEventListeners };
};

/**
 * Utility hook for creating D3 scales with automatic domain updates.
 * 
 * @param data - Data array for calculating domains
 * @param scaleType - Type of scale to create ('linear', 'time', 'ordinal', etc.)
 * @param range - Range for the scale
 * @param deps - Dependencies that should trigger a scale update
 * @returns D3 scale function
 */
export const useD3Scale = <T>(
  data: T[],
  scaleType: 'linear' | 'time' | 'ordinal' | 'band' | 'point',
  range: [number, number],
  deps: DependencyList = [],
) => {
  return useCallback(() => {
    switch (scaleType) {
      case 'linear':
        return d3.scaleLinear()
          .domain(d3.extent(data, d => d as number) as [number, number])
          .range(range);
      
      case 'time':
        return d3.scaleTime()
          .domain(d3.extent(data, d => new Date(d as string)) as [Date, Date])
          .range(range);
      
      case 'ordinal':
        return d3.scaleOrdinal()
          .domain(data.map(d => d as string))
          .range(range);
      
      case 'band':
        return d3.scaleBand()
          .domain(data.map(d => d as string))
          .range(range);
      
      case 'point':
        return d3.scalePoint()
          .domain(data.map(d => d as string))
          .range(range);
      
      default:
        return d3.scaleLinear()
          .domain(d3.extent(data, d => d as number) as [number, number])
          .range(range);
    }
  }, [data, scaleType, range, ...deps]);
};
