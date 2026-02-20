package com.parkease.backend.controller;

import com.parkease.backend.entity.Notification;
import com.parkease.backend.entity.User;
import com.parkease.backend.enumtype.Role;
import com.parkease.backend.repository.NotificationRepository;
import com.parkease.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/broadcast")
public class NotificationController {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NotificationController(UserRepository userRepository, NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @PostMapping
    public ResponseEntity<?> sendBroadcast(@RequestBody Map<String, String> payload) {
        try {
            String message = payload.get("message");
            String title = payload.get("title") != null ? payload.get("title") : "System Update";

            // 1. Create Notifications for all Drivers and Providers
            List<User> targets = userRepository.findByRoleIn(List.of(Role.DRIVER, Role.PROVIDER));

            List<Notification> notifications = targets.stream().map(user -> {
                Notification n = new Notification();
                n.setUserId(user.getId());
                n.setTitle(title);
                n.setMessage(message);
                n.setTargetRole(user.getRole().name());
                n.setCreatedAt(LocalDateTime.now());
                n.setRead(false);
                return n;
            }).collect(Collectors.toList());

            notificationRepository.saveAll(notifications);

            System.out.println("📢 BROADCAST SENT: " + title + " to " + targets.size() + " users.");
            return ResponseEntity.ok(Map.of("status", "success", "sentCount", targets.size()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Gateway Error: " + e.getMessage());
        }
    }
}
