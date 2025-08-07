import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertCircle, RefreshCw, TrendingUp, BarChart3, Activity, PieChart as PieChartIcon, Donut, Target, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart as ReBarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, LineChart as ReLineChart, Line, AreaChart as ReAreaChart, Area } from 'recharts';

// Chart filter presets
const CHART_FILTER_PRESETS = {
  default: {
    timeGranularity: 'weekly',
    comparisonPeriod: 'none',
    trendSmoothing: 'none',
    chartType: 'line',
    showProjections: false,
    showConfidenceIntervals: false,
    highlightOutliers: false,
    dataAggregation: 'average',
    colorScheme: 'sequential',
  },
  detailed: {
    timeGranularity: 'daily',
    comparisonPeriod: 'previous_week',
    trendSmoothing: 'moving_average',
    chartType: 'line',
    showProjections: true,
    showConfidenceIntervals: true,
    highlightOutliers: true,
    dataAggregation: 'average',
    colorScheme: 'diverging',
  },
  comparison: {
    timeGranularity: 'monthly',
    comparisonPeriod: 'previous_month',
    trendSmoothing: 'none',
    chartType: 'bar',
    showProjections: false,
    showConfidenceIntervals: false,
    highlightOutliers: false,
    dataAggregation: 'average',
    colorScheme: 'categorical',
  },
  trend: {
    timeGranularity: 'weekly',
    comparisonPeriod: 'same_period_last_year',
    trendSmoothing: 'exponential',
    chartType: 'line',
    showProjections: true,
    showConfidenceIntervals: true,
    highlightOutliers: true,
    dataAggregation: 'average',
    colorScheme: 'sequential',
  },
};

type ChartFilters = typeof CHART_FILTER_PRESETS.default;

// Chart filter selectors
const TimeGranularitySelector: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-24 h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="hourly">Hourly</SelectItem>
      <SelectItem value="daily">Daily</SelectItem>
      <SelectItem value="weekly">Weekly</SelectItem>
      <SelectItem value="monthly">Monthly</SelectItem>
    </SelectContent>
  </Select>
);

const ChartTypeSelector: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-1 bg-white rounded border p-1">
    <Button variant={value === 'line' ? 'default' : 'ghost'} size="sm" onClick={() => onChange('line')} className="h-6 w-6 p-0"><TrendingUp className="w-3 h-3" /></Button>
    <Button variant={value === 'bar' ? 'default' : 'ghost'} size="sm" onClick={() => onChange('bar')} className="h-6 w-6 p-0"><BarChart3 className="w-3 h-3" /></Button>
    <Button variant={value === 'area' ? 'default' : 'ghost'} size="sm" onClick={() => onChange('area')} className="h-6 w-6 p-0"><Activity className="w-3 h-3" /></Button>
    <Button variant={value === 'pie' ? 'default' : 'ghost'} size="sm" onClick={() => onChange('pie')} className="h-6 w-6 p-0"><PieChartIcon className="w-3 h-3" /></Button>
    <Button variant={value === 'doughnut' ? 'default' : 'ghost'} size="sm" onClick={() => onChange('doughnut')} className="h-6 w-6 p-0"><Donut className="w-3 h-3" /></Button>
    <Button variant={value === 'horizontal-bar' ? 'default' : 'ghost'} size="sm" onClick={() => onChange('horizontal-bar')} className="h-6 w-6 p-0"><BarChart3 className="w-3 h-3" /></Button>
  </div>
);

const ComparisonPeriodSelector: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-32 h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No Comparison</SelectItem>
      <SelectItem value="previous_week">Previous Week</SelectItem>
      <SelectItem value="previous_month">Previous Month</SelectItem>
      <SelectItem value="same_period_last_year">Last Year</SelectItem>
    </SelectContent>
  </Select>
);

const TrendSmoothingSelector: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-28 h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No Smoothing</SelectItem>
      <SelectItem value="moving_average">Moving Avg</SelectItem>
      <SelectItem value="exponential">Exponential</SelectItem>
    </SelectContent>
  </Select>
);

const ChartFilterBar: React.FC<{
  filters: ChartFilters;
  setFilters: React.Dispatch<React.SetStateAction<ChartFilters>>;
}> = ({ filters, setFilters }) => (
  <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
    <TimeGranularitySelector value={filters.timeGranularity} onChange={v => setFilters({ ...filters, timeGranularity: v })} />
    <ChartTypeSelector value={filters.chartType} onChange={v => setFilters({ ...filters, chartType: v })} />
    <ComparisonPeriodSelector value={filters.comparisonPeriod} onChange={v => setFilters({ ...filters, comparisonPeriod: v })} />
    <TrendSmoothingSelector value={filters.trendSmoothing} onChange={v => setFilters({ ...filters, trendSmoothing: v })} />
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, showProjections: !filters.showProjections })} className={`h-6 px-2 text-xs ${filters.showProjections ? 'bg-blue-100 text-blue-700' : ''}`}><Target className="w-3 h-3 mr-1" />Projections</Button>
      <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, highlightOutliers: !filters.highlightOutliers })} className={`h-6 px-2 text-xs ${filters.highlightOutliers ? 'bg-red-100 text-red-700' : ''}`}><AlertTriangle className="w-3 h-3 mr-1" />Outliers</Button>
    </div>
  </div>
);

// Chart loading and error states
const ChartLoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-32 bg-gray-200 rounded mb-2"></div>
    <div className="flex justify-between">
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

const ChartErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-32 text-center">
    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
    <p className="text-sm text-gray-600 mb-2">{error}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="w-3 h-3 mr-1" />
      Retry
    </Button>
  </div>
);

const ChartEmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-32 text-center">
    <BarChart3 className="w-8 h-8 text-gray-400 mb-2" />
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

// Main AnalyticsChartCard
interface AnalyticsChartCardProps {
  title: string;
  icon: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  actions?: React.ReactNode;
  data: any[];
}

const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
  title,
  icon,
  loading = false,
  error = null,
  onRetry,
  actions,
  data,
}) => {
  const [filters, setFilters] = useState<ChartFilters>(CHART_FILTER_PRESETS.default);
  const [showFilters, setShowFilters] = useState(false);

  // Example: filter/transform data based on filters (extensible)
  let filteredData = data;
  // (Add more advanced filtering/aggregation logic here as needed)

  // Chart rendering logic based on filters.chartType
  let chartContent = null;
  switch (filters.chartType) {
    case 'pie':
      chartContent = (
        <ResponsiveContainer width="100%" height={200}>
          <RePieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value, name) => [value, name]}
              labelFormatter={label => `${label}`}
            />
          </RePieChart>
        </ResponsiveContainer>
      );
      break;
    case 'doughnut':
      chartContent = (
        <ResponsiveContainer width="100%" height={200}>
          <RePieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={60}
              innerRadius={30}
              fill="#8884d8"
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value, name) => [value, name]}
              labelFormatter={label => `${label}`}
            />
          </RePieChart>
        </ResponsiveContainer>
      );
      break;
    case 'bar':
      chartContent = (
        <ResponsiveContainer width="100%" height={200}>
          <ReBarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={filteredData[0]?.name ? 'name' : 'x'} fontSize={10} />
            <YAxis domain={[0, 'dataMax + 10']} fontSize={10} />
            <RechartsTooltip 
              formatter={(value, name) => [value, name]}
            />
            <Bar dataKey="value" fill="#3b82f6">
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      );
      break;
    case 'horizontal-bar':
      chartContent = (
        <ResponsiveContainer width="100%" height={200}>
          <ReBarChart data={filteredData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 'dataMax + 10']} fontSize={10} />
            <YAxis dataKey={filteredData[0]?.name ? 'name' : 'y'} type="category" fontSize={10} />
            <RechartsTooltip 
              formatter={(value, name) => [value, name]}
            />
            <Bar dataKey="value" fill="#3b82f6">
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      );
      break;
    case 'line':
      chartContent = (
        <ResponsiveContainer width="100%" height={200}>
          <ReLineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={filteredData[0]?.name ? 'name' : 'x'} fontSize={10} />
            <YAxis fontSize={10} />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </ReLineChart>
        </ResponsiveContainer>
      );
      break;
    case 'area':
      chartContent = (
        <ResponsiveContainer width="100%" height={200}>
          <ReAreaChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={filteredData[0]?.name ? 'name' : 'x'} fontSize={10} />
            <YAxis fontSize={10} />
            <RechartsTooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
          </ReAreaChart>
        </ResponsiveContainer>
      );
      break;
    default:
      chartContent = <ChartEmptyState message="No chart type selected or no data available." />;
  }

  return (
  <Card className="border border-blue-200">
    <CardHeader className="pb-3 flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-sm">
        {icon}
        {title}
      </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(f => !f)}>
            Filters
          </Button>
          {actions}
        </div>
    </CardHeader>
      {showFilters && <ChartFilterBar filters={filters} setFilters={setFilters} />}
    <CardContent>
      {loading ? (
          <ChartLoadingSkeleton />
      ) : error ? (
          <ChartErrorState error={error} onRetry={onRetry || (() => {})} />
        ) : (
          chartContent
      )}
    </CardContent>
  </Card>
);
};

export default AnalyticsChartCard; 