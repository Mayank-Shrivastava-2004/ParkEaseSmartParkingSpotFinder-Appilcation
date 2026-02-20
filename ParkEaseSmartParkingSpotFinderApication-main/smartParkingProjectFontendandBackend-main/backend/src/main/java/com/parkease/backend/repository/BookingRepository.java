package com.parkease.backend.repository;

import com.parkease.backend.entity.Booking;
import com.parkease.backend.entity.ParkingLot;
import com.parkease.backend.entity.User;
import com.parkease.backend.enumtype.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByDriver(User driver);

    List<Booking> findByDriverIdOrderByStartTimeDesc(Long driverId);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.parkingLot WHERE b.driver.id = :driverId ORDER BY b.startTime DESC")
    List<Booking> findByDriverIdWithParkingLot(@Param("driverId") Long driverId);

    List<Booking> findByDriverIdAndStatus(Long driverId, BookingStatus status);

    List<Booking> findByParkingLot(ParkingLot parkingLot);

    List<Booking> findByStatus(BookingStatus status);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.parkingLot.provider.id = :providerId
                  AND b.status = 'COMPLETED'
            """)
    List<Booking> findTodayBookingsForProvider(@Param("providerId") Long providerId);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.parkingLot.provider.id = :providerId
                  AND b.status = 'COMPLETED'
            """)
    List<Booking> findCompletedBookingsForProvider(@Param("providerId") Long providerId);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.parkingLot.id = :parkingLotId
                  AND b.status IN :statuses
            """)
    List<Booking> findActiveBookingsForLot(
            @Param("parkingLotId") Long parkingLotId,
            @Param("statuses") List<BookingStatus> statuses);

    long countByStatus(BookingStatus status);

    long countByCreatedAtAfter(LocalDateTime date);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatusAndCreatedAtBetween(
            BookingStatus status,
            LocalDateTime start,
            LocalDateTime end);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.parkingLot.id = :lotId
                  AND b.status IN ('COMPLETED', 'CANCELLED')
                ORDER BY b.endTime DESC
            """)
    List<Booking> findBookingHistory(@Param("lotId") Long lotId);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.parkingLot.provider.id = :providerId
                  AND b.status = 'COMPLETED'
                  AND b.endTime >= :start
            """)
    List<Booking> findCompletedBookingsAfter(
            @Param("providerId") Long providerId,
            @Param("start") java.time.LocalDateTime start);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.parkingLot.provider.id = :providerId AND b.status = 'ACTIVE'")
    long countActiveBookingsByProvider(@Param("providerId") Long providerId);

    @Query("SELECT b FROM Booking b WHERE b.parkingLot.provider.id = :providerId ORDER BY b.createdAt DESC")
    List<Booking> findRecentBookingsByProvider(@Param("providerId") Long providerId,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.parkingLot.provider.id = :providerId")
    long countByProvider(@Param("providerId") Long providerId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.parkingLot.provider.id = :providerId AND b.status = :status")
    long countByProviderAndStatus(@Param("providerId") Long providerId, @Param("status") BookingStatus status);

    List<Booking> findByStatusAndEndTimeIsNotNull(BookingStatus status);

    long countByParkingLot_Provider_IdAndParkingSlot_VehicleType(Long providerId,
            com.parkease.backend.enumtype.VehicleType vehicleType);

    List<Booking> findByParkingLot_Provider_IdAndStartTimeBetween(Long providerId, LocalDateTime start,
            LocalDateTime end);

    @Query("SELECT b.parkingSlot.id FROM Booking b WHERE b.parkingLot.id = :lotId AND b.status IN :statuses AND (b.startTime < :endTime AND b.endTime > :startTime)")
    List<Long> findOccupiedSlotIds(@Param("lotId") Long lotId, @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime, @Param("statuses") List<BookingStatus> statuses);

    @Query(value = "SELECT COUNT(DISTINCT driver_id) FROM bookings", nativeQuery = true)
    long countDistinctDrivers();

    @Query(value = "SELECT COUNT(*) FROM (SELECT driver_id FROM bookings GROUP BY driver_id HAVING COUNT(*) > 1) AS repeat_drivers", nativeQuery = true)
    long countRepeatDrivers();

    @Query(value = "SELECT HOUR(start_time) as hr, COUNT(*) as cnt FROM bookings GROUP BY hr ORDER BY cnt DESC LIMIT 5", nativeQuery = true)
    List<Object[]> getPeakBookingHours();

    @Query(value = "SELECT u.full_name, u.email, COUNT(b.id) as bcount FROM bookings b JOIN users u ON b.driver_id = u.id GROUP BY u.id, u.full_name, u.email ORDER BY bcount DESC LIMIT 5", nativeQuery = true)
    List<Object[]> getTopLoyalDrivers();
}
