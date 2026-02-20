package com.parkease.backend.dto;

import java.util.List;

public class AdminAnalyticsResponse {
    public Revenue revenue;
    public List<BookingTrend> bookingTrend;
    public List<TopProvider> topProviders;
    public UserGrowth userGrowth;
    public SummaryMetrics summary;
    public List<PeakHour> peakHours;

    public static class SummaryMetrics {
        public long totalProviders;
        public long pendingApprovals;
        public long activeDrivers;
        public long todaysBookings;
        public long totalRevenue;
        public long availableSlots;
        public long completedBookings;
        public long totalBookingValue;

        // Growth markers
        public int providersGrowth;
        public int pendingUrgent;
        public int driversGrowth;
        public int bookingsGrowth;
        public int revenueGrowth;
    }

    public static class PeakHour {
        public String timeSlot;
        public int percentage;
        public int bookings;
    }

    public static class Revenue {
        public long total = 0;
        public long platformFees = 0;
        public long providerEarnings = 0;
        public int growth = 0;
        public long avgDailyRevenue = 0;
    }

    public static class BookingTrend {
        public String label;
        public int value;
        public long revenue;
    }

    public static class TopProvider {
        public Long id;
        public String name;
        public int activeSinceDays;
    }

    public static class UserGrowth {
        public Group drivers;
        public Group providers;
        public List<UserGrowthTrend> growthTrend;

        public static class Group {
            public long total;
            public long newThisWeek;
        }
    }

    public static class UserGrowthTrend {
        public String label;
        public int drivers;
        public int providers;
    }

    public Occupancy occupancy;

    public static class Occupancy {
        public long totalSlots;
        public long occupiedSlots;
        public long availableSlots;
        public int occupancyPercentage;
    }

    public List<DemandZone> demandZones;
    public List<DriverLocation> activeDriversLocation;
    public ProviderAvailability providerAvailability;

    public static class DemandZone {
        public String area;
        public int intensity; // 1-100
        public int requests;
    }

    public static class DriverLocation {
        public String driverName;
        public String area;
        public String status;
    }

    public static class ProviderAvailability {
        public int free;
        public int busy;
        public int total;
    }

}
