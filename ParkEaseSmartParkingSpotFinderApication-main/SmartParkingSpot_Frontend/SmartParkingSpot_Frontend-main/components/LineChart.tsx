import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
    label: string;
    value: number;
}

interface LineChartProps {
    data: DataPoint[];
    lineColor?: string;
    fillColor?: string;
    title?: string;
    height?: number;
    valuePrefix?: string;
    dark?: boolean;
}

export default function LineChart({
    data,
    lineColor = '#6366F1',
    fillColor = '#6366F1',
    title,
    height = 160,
    valuePrefix = '',
    dark = false,
}: LineChartProps) {
    const screenWidth = Dimensions.get('window').width - 80; // padding
    const chartHeight = height;
    const padding = 40;

    // USE MOCK DATA IF EMPTY TO SHOW ZERO LINE
    const effectiveData = (!data || data.length === 0)
        ? [
            { label: 'Jan', value: 0 },
            { label: 'Feb', value: 0 },
            { label: 'Mar', value: 0 },
            { label: 'Apr', value: 0 },
            { label: 'May', value: 0 },
            { label: 'Jun', value: 0 }
        ]
        : data;

    const values = effectiveData.map(d => d.value);
    const maxValue = Math.max(...values, 10); // Default max 10 if all zeros
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;

    const pointSpacing = screenWidth / (effectiveData.length - 1 || 1);

    // Generate path for line
    const linePath = effectiveData.map((point, index) => {
        const x = index * pointSpacing;
        const normalizedValue = (point.value - minValue) / valueRange;
        const y = chartHeight - padding - (normalizedValue * (chartHeight - padding * 2));
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Generate path for filled area
    const areaPath = `${linePath} L ${(effectiveData.length - 1) * pointSpacing} ${chartHeight - padding} L 0 ${chartHeight - padding} Z`;

    return (
        <View className="mt-4">
            {title && (
                <Text className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{title}</Text>
            )}
            <View className={`${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-2xl p-4 border`}>
                <Svg width={screenWidth} height={chartHeight}>
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => {
                        const y = padding + (i * (chartHeight - padding * 2) / 4);
                        return (
                            <Line
                                key={`grid-${i}`}
                                x1="0"
                                y1={y}
                                x2={screenWidth}
                                y2={y}
                                stroke={dark ? "#1E293B" : "#F1F5F9"}
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Filled area */}
                    <Path
                        d={areaPath}
                        fill={fillColor}
                        fillOpacity={dark ? "0.2" : "0.1"}
                    />

                    {/* Line */}
                    <Path
                        d={linePath}
                        stroke={lineColor}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {effectiveData.map((point, index) => {
                        const x = index * pointSpacing;
                        const y = chartHeight - padding - (((point.value - minValue) / valueRange) * (chartHeight - padding * 2));
                        return (
                            <Circle
                                key={`point-${index}`}
                                cx={x}
                                cy={y}
                                r="4"
                                fill={lineColor}
                                stroke={dark ? "#0F172A" : "white"}
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* Labels */}
                    {effectiveData.map((point, index) => {
                        const x = index * pointSpacing;
                        // Avoid crowding
                        const skipInterval = effectiveData.length > 8 ? Math.ceil(effectiveData.length / 5) : 1;
                        if (index % skipInterval !== 0 && index !== effectiveData.length - 1) return null;

                        return (
                            <SvgText
                                key={`label-${index}`}
                                x={x}
                                y={chartHeight - 10}
                                fontSize="9"
                                fill={dark ? "#475569" : "#94A3B8"}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {point.label}
                            </SvgText>
                        );
                    })}
                </Svg>

                {/* Legend */}
                <View className="flex-row justify-between mt-4 px-2">
                    <View>
                        <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Min</Text>
                        <Text className={`text-xs font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{valuePrefix}{minValue.toLocaleString()}</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Avg</Text>
                        <Text className={`text-xs font-black ${dark ? 'text-white' : 'text-gray-900'}`}>
                            {valuePrefix}{Math.round(effectiveData.reduce((sum, d) => sum + d.value, 0) / effectiveData.length).toLocaleString()}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Max</Text>
                        <Text className={`text-xs font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{valuePrefix}{maxValue.toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
