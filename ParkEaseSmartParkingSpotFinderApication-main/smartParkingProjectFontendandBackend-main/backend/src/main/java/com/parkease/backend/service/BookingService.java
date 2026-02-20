package com.parkease.backend.service;

import com.parkease.backend.entity.Booking;
import com.parkease.backend.entity.ParkingLot;
import com.parkease.backend.entity.ParkingSlot;
import com.parkease.backend.entity.User;
import com.parkease.backend.enumtype.BookingStatus;
import com.parkease.backend.repository.BookingRepository;
import com.parkease.backend.repository.ParkingSlotRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingSlotRepository slotRepository;

    public BookingService(
            BookingRepository bookingRepository,
            ParkingSlotRepository slotRepository) {
        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
    }

    @Transactional
    public Booking startBooking(User driver, ParkingLot lot, ParkingSlot slot, String vehicleNumber) {

        if (slot.isOccupied()) {
            throw new IllegalStateException("Slot already occupied");
        }

        // occupy slot
        slot.setOccupied(true);
        slotRepository.save(slot);

        Booking booking = new Booking();
        booking.setDriver(driver);
        booking.setParkingLot(lot);
        booking.setParkingSlot(slot);
        booking.setVehicleNumber(vehicleNumber);
        booking.setStartTime(LocalDateTime.now());
        // Fix: Initialize endTime to avoid "not-null property references a null" error
        booking.setEndTime(booking.getStartTime().plusHours(1));
        booking.setStatus(BookingStatus.ACTIVE);

        return bookingRepository.save(booking);
    }

    @Transactional
    public void endBooking(Booking booking) {

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setEndTime(LocalDateTime.now());

        ParkingSlot slot = booking.getParkingSlot();
        slot.setOccupied(false);

        slotRepository.save(slot);
        bookingRepository.save(booking);
    }

    @Transactional
    public void cancelBooking(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);
        ParkingSlot slot = booking.getParkingSlot();
        if (slot != null) {
            slot.setOccupied(false);
            slotRepository.save(slot);
        }
        bookingRepository.save(booking);
    }
}
