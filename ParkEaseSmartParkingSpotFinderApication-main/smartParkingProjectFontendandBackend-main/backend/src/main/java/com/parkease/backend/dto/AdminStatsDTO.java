package com.parkease.backend.dto;

public class AdminStatsDTO {
    public double totalRevenue;
    public double bookingSuccessRate;
    public double occupancyRate;
    public long userGrowth;

    public AdminStatsDTO() {
    }

    public AdminStatsDTO(double totalRevenue, double bookingSuccessRate, double occupancyRate, long userGrowth) {
        this.totalRevenue = totalRevenue;
        this.bookingSuccessRate = bookingSuccessRate;
        this.occupancyRate = occupancyRate;
        this.userGrowth = userGrowth;
    }
}
