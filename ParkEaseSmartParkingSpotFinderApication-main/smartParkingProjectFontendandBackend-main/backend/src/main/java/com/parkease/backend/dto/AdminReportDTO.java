package com.parkease.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AdminReportDTO {

    @Data
    public static class TrendData {
        private String label;
        private double value;
    }

    @Data
    public static class RevenueLog {
        private String transactionId;
        private LocalDateTime dateTime;
        private String providerName;
        private double totalAmount;
        private double adminCommission;
        private String status;
    }

    @Data
    public static class RevenueReportResponse {
        private List<RevenueLog> logs;
        private List<TrendData> trend;
        private double totalNetRevenue;
        private int totalPages;
        private long totalElements;
    }

    @Data
    public static class BookingDetail {
        private Long bookingId;
        private String driverName;
        private String vehicleNumber;
        private String providerName;
        private String spotName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String paymentStatus;
        private String bookingStatus;
    }

    @Data
    public static class BookingReportResponse {
        private List<BookingDetail> bookings;
        private List<TrendData> trend;
        private int totalPages;
        private long totalElements;
    }
}
