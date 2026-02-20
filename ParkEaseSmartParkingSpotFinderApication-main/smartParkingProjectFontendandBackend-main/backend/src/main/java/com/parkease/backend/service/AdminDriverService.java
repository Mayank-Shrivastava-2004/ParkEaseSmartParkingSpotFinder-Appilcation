package com.parkease.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.parkease.backend.dto.AdminDriverResponse;
import com.parkease.backend.entity.Notification;
import com.parkease.backend.entity.User;
import com.parkease.backend.enumtype.Role;
import com.parkease.backend.repository.NotificationRepository;
import com.parkease.backend.repository.UserRepository;

@Service
@Transactional
public class AdminDriverService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public AdminDriverService(UserRepository userRepository, NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    // ===== GET ALL DRIVERS =====
    public List<AdminDriverResponse> getDrivers(String status) {
        return userRepository.findByRole(Role.DRIVER)
                .stream()
                .filter(u -> {
                    if ("PENDING".equalsIgnoreCase(status))
                        return !u.isApproved();
                    if ("APPROVED".equalsIgnoreCase(status))
                        return u.isApproved();
                    return true;
                })
                .map(this::map)
                .toList();
    }

    // ===== APPROVE DRIVER =====
    public void approveDriver(Long id) {
        User u = getDriver(id);
        u.setApproved(true);
        u.setEnabled(true);
        u.setVerificationStatus(com.parkease.backend.enumtype.VerificationStatus.APPROVED);
        userRepository.save(u);

        // ✅ NOTIFY DRIVER
        try {
            createNotification(
                    "Account Approved! Welcome to ParkEase.",
                    "DRIVER", "INFO", id);
        } catch (Exception e) {
            System.err.println("Non-critical: Notification failed, but driver is approved.");
        }
    }

    // ===== REJECT DRIVER =====
    public void rejectDriver(Long id) {
        User u = getDriver(id);
        userRepository.delete(u);

        // ✅ NOTIFY ADMIN
        createNotification(
                "A driver application was rejected by admin.",
                "ADMIN");
    }

    // ===== SUSPEND DRIVER =====
    public void suspendDriver(Long id) {
        User u = getDriver(id);
        u.setEnabled(false);
        userRepository.save(u);

        // ✅ NOTIFY DRIVER
        createNotification(
                "Your driver account has been suspended by admin.",
                "DRIVER");
    }

    // ===== REACTIVATE DRIVER =====
    public void reactivateDriver(Long id) {
        User u = getDriver(id);
        u.setEnabled(true);
        userRepository.save(u);

        // ✅ NOTIFY DRIVER
        createNotification(
                "Your driver account has been reactivated by admin.",
                "DRIVER");
    }

    // ===== HELPERS =====
    private User getDriver(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        if (u.getRole() != Role.DRIVER) {
            throw new RuntimeException("User is not a driver");
        }
        return u;
    }

    private void createNotification(String message, String targetRole) {
        createNotification(message, targetRole, "INFO", null);
    }

    private void createNotification(String message, String targetRole, String type, Long refId) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTargetRole(targetRole);
        notification.setType(type);
        notification.setRefId(refId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);
    }

    private AdminDriverResponse map(User u) {
        AdminDriverResponse d = new AdminDriverResponse();
        d.id = u.getId();
        d.name = u.getFullName();
        d.email = u.getEmail();
        d.phone = u.getPhoneNumber();
        d.joinedDate = u.getCreatedAt();
        d.status = !u.isApproved() ? "pending" : (u.isEnabled() ? "active" : "suspended");
        d.approved = u.isApproved();

        if (u.getVehicleNumber() != null)
            d.vehicleNumber = u.getVehicleNumber();
        if (u.getVehicleType() != null)
            d.vehicleType = u.getVehicleType();

        return d;
    }
}
