import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface CategoryData {
  category: string;
  sales: number;
  percentage: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  loading?: boolean;
}

export function CategoryBreakdownChart({ data, loading = false }: CategoryBreakdownChartProps) {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort data by sales descending and take top 5
  const sortedData = [...data].sort((a, b) => b.sales - a.sales);
  const top5 = sortedData.slice(0, 5);
  const others = sortedData.slice(5);
  
  // Calculate "Others" total if there are more than 5 categories
  const processedData = [...top5];
  if (others.length > 0) {
    const othersTotal = others.reduce((sum, item) => sum + item.sales, 0);
    const totalSales = sortedData.reduce((sum, item) => sum + item.sales, 0);
    processedData.push({
      category: 'Others',
      sales: othersTotal,
      percentage: (othersTotal / totalSales) * 100,
    });
  }

  // Chart colors - gradient greens for top categories, gray for Others
  const colors = processedData.map((item, index) => {
    if (item.category === 'Others') {
      return 'rgba(156, 163, 175, 0.8)'; // Gray for Others
    }
    const intensity = 1 - (index * 0.15);
    return `rgba(22, 163, 74, ${Math.max(0.6, intensity)})`;
  });

  const chartData = {
    labels: processedData.map(item => item.category),
    datasets: [
      {
        label: 'Sales',
        data: processedData.map(item => item.sales),
        backgroundColor: colors,
        borderColor: colors.map(color => {
          if (color.includes('156, 163, 175')) return 'rgba(156, 163, 175, 1)';
          return color.replace(/[\d.]+\)$/g, '1)');
        }),
        borderWidth: 1,
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: '#475569',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            const index = context.dataIndex;
            const percentage = processedData[index].percentage;
            return `Sales: ${formatCurrency(context.parsed.y)} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#1f2937',
          font: {
            size: 11,
            weight: 600,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 116, 139, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: 500,
          },
          callback: function(value) {
            const numValue = Number(value);
            if (numValue === 0) return '₱0';
            if (numValue < 1000) return `₱${numValue.toFixed(0)}`;
            if (numValue < 1000000) return `₱${(numValue / 1000).toFixed(1)}k`;
            return `₱${(numValue / 1000000).toFixed(1)}M`;
          },
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
