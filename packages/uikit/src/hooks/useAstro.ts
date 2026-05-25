'use client';
import { useState, useCallback } from 'react';
import { NavaAstroSDK, CalculationParams, AstroChartData, MuhurtaResult, SadeSatiResult, YogaResult } from '@nava-astro/core';

const sdk = new NavaAstroSDK();

interface AstroState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useChart() {
  const [state, setState] = useState<AstroState<{
    chart: AstroChartData;
    yogas: YogaResult[];
    report: string;
  }>>({ data: null, loading: false, error: null });

  const analyze = useCallback(async (params: CalculationParams) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await sdk.analyze(params);
      setState({ data: { chart: result.math, yogas: result.activeRules, report: result.aiReport || '' }, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'Analysis failed' });
    }
  }, []);

  return { ...state, analyze };
}

export function useMuhurta() {
  const [state, setState] = useState<AstroState<MuhurtaResult[]>>({ data: null, loading: false, error: null });

  const find = useCallback(async (params: CalculationParams, opts?: { rangeHours?: number; stepMinutes?: number; top?: number }) => {
    setState({ data: null, loading: true, error: null });
    try {
      const results = await sdk.findMuhurtas(params, opts);
      setState({ data: results, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'Muhurta search failed' });
    }
  }, []);

  return { ...state, findMuhurtas: find };
}

export function useSadeSati() {
  const [state, setState] = useState<AstroState<SadeSatiResult>>({ data: null, loading: false, error: null });

  const analyze = useCallback(async (params: CalculationParams) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await sdk.analyzeSadeSati(params);
      setState({ data: result, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'Sade Sati analysis failed' });
    }
  }, []);

  return { ...state, analyze };
}
