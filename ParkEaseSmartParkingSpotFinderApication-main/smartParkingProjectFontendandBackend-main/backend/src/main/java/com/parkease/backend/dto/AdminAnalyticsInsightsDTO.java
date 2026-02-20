package com.parkease.backend.dto;

import java.util.List;

public class AdminAnalyticsInsightsDTO {
    public List<HighDemandZone> highDemandZones;
    public List<UnderperformingSpot> underperformingSpots;
    public List<RevenueAnomaly> revenueAnomalies;
    public double averageTransactionValue;
    public List<PeakHourInfo> peakBookingHours;
    public double userRetentionRate;
    public double activeOccupancy;
    public List<CategoryRevenue> revenueByCategory;
    public List<LoyalDriver> loyalDrivers;

    public static class HighDemandZone {
        public Long lotId;
        public String name;
        public int occupancyRate;

        public HighDemandZone(Long lotId, String name, int occupancyRate) {
            this.lotId = lotId;
            this.name = name;
            this.occupancyRate = occupancyRate;
        }
    }

    public static class UnderperformingSpot {
        public Long lotId;
        public String name;
        public long bookingCount;

        public UnderperformingSpot(Long lotId, String name, long bookingCount) {
            this.lotId = lotId;
            this.name = name;
            this.bookingCount = bookingCount;
        }
    }

    public static class RevenueAnomaly {
        public String date;
        public double amount;
        public String type; // SPIKE, DROP

        public RevenueAnomaly(String date, double amount, String type) {
            this.date = date;
            this.amount = amount;
            this.type = type;
        }
    }

    public static class PeakHourInfo {
        public String hour;
        public long count;

        public PeakHourInfo(String hour, long count) {
            this.hour = hour;
            this.count = count;
        }
    }

    public static class CategoryRevenue {
        public String category;
        public double revenue;

        public CategoryRevenue(String category, double revenue) {
            this.category = category;
            this.revenue = revenue;
        }
    }

    public static class LoyalDriver {
        public String name;
        public String email;
        public long count;

        public LoyalDriver(String name, String email, long count) {
            this.name = name;
            this.email = email;
            this.count = count;
        }
    }
}
