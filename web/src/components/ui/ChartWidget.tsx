import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';

interface ChartWidgetProps {
  data: { time: string; value: number }[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
  height?: number;
}

export function ChartWidget({
  data,
  colors: {
    backgroundColor = 'transparent',
    textColor = '#9ca3af',
    lineColor = '#6366f1',
    areaTopColor = 'rgba(99, 102, 241, 0.4)',
    areaBottomColor = 'rgba(99, 102, 241, 0.0)',
  } = {},
  height = 300,
}: ChartWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    chartRef.current = chart;

    const areaSeries = (chart as any).addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
    });

    areaSeries.setData(data);
    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, textColor, lineColor, areaTopColor, areaBottomColor, height]);

  return <div ref={chartContainerRef} className="w-full" />;
}
