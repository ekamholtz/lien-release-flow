
import * as React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "./chart";
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
  valueFormatter = (value) => value.toString(),
  className,
}: BarChartProps) {
  return (
    <ChartContainer
      className={cn("w-full h-full", className)}
      config={{
        primary: {
          color: colors[0],
        },
        secondary: {
          color: colors[1],
        },
        tertiary: {
          color: colors[2],
        },
        quaternary: {
          color: colors[3],
        },
      }}
    >
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={index} />
        <YAxis />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value: number) => valueFormatter(value)} />
          }
        />
        <Legend />
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            name={category}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}

interface PieChartProps {
  data: any[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function PieChart({
  data,
  index,
  category,
  colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
  valueFormatter = (value) => value.toString(),
  className,
}: PieChartProps) {
  return (
    <ChartContainer
      className={cn("w-full h-full", className)}
      config={{}}
    >
      <RechartsPieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={category}
          nameKey={index}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              formatter={(value: number) => valueFormatter(value)}
              labelFormatter={(name) => `${name}`}
            />
          }
        />
        <Legend />
      </RechartsPieChart>
    </ChartContainer>
  );
}

interface AreaChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function AreaChart({
  data,
  index,
  categories,
  colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
  valueFormatter = (value) => value.toString(),
  className,
}: AreaChartProps) {
  return (
    <ChartContainer
      className={cn("w-full h-full", className)}
      config={{}}
    >
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {categories.map((category, i) => (
            <linearGradient key={category} id={`color-${category}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={index} />
        <YAxis />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value: number) => valueFormatter(value)} />
          }
        />
        <Legend />
        {categories.map((category, i) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            fillOpacity={1}
            fill={`url(#color-${category})`}
            name={category}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
}
