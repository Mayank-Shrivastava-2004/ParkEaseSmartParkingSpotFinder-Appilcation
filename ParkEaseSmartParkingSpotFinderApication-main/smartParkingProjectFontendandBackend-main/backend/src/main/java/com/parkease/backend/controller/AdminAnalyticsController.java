package com.parkease.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.parkease.backend.dto.AdminAnalyticsResponse;
import com.parkease.backend.dto.ParkingDurationResponse;
import com.parkease.backend.service.AdminAnalyticsService;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService service;

    public AdminAnalyticsController(AdminAnalyticsService service) {
        this.service = service;
    }

    @GetMapping
    public AdminAnalyticsResponse analytics(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "WEEK") String range) {
        return service.getAnalytics(range);
    }

    @GetMapping("/parking-duration")
    public ParkingDurationResponse parkingDuration() {
        return service.getParkingDurationAnalytics();
    }

    @GetMapping("/overview")
    public com.parkease.backend.dto.AdminStatsDTO getOverview() {
        return service.getOverview();
    }

    @GetMapping("/revenue-trend")
    public com.parkease.backend.dto.RevenueChartDTO getRevenueTrend() {
        return service.getRevenueTrend();
    }

    @GetMapping("/revenue-velocity")
    public com.parkease.backend.dto.RevenueChartDTO getRevenueVelocity() {
        return service.getRevenueTrend();
    }

    @GetMapping("/velocity")
    public com.parkease.backend.dto.RevenueChartDTO getVelocity() {
        return service.getRevenueTrend();
    }

    @GetMapping("/insights")
    public com.parkease.backend.dto.AdminAnalyticsInsightsDTO getInsights() {
        return service.getInsights();
    }

    @GetMapping("/role-distribution")
    public com.parkease.backend.dto.RoleDistributionDTO getRoleDistribution() {
        return service.getRoleDistribution();
    }
}
