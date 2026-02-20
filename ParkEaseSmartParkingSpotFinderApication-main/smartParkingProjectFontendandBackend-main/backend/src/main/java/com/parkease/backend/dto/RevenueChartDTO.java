package com.parkease.backend.dto;

import java.util.List;

public class RevenueChartDTO {
    public List<String> labels;
    public List<Double> data;

    public RevenueChartDTO() {
    }

    public RevenueChartDTO(List<String> labels, List<Double> data) {
        this.labels = labels;
        this.data = data;
    }
}
