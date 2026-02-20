package com.parkease.backend.controller;

import com.parkease.backend.entity.User;
import com.parkease.backend.entity.ChatMessage;
import com.parkease.backend.entity.Notification;
import com.parkease.backend.repository.UserRepository;
import com.parkease.backend.repository.ChatMessageRepository;
import com.parkease.backend.repository.NotificationRepository;
import com.parkease.backend.enumtype.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/support")
@CrossOrigin
public class SupportChatController {

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;

    public SupportChatController(
            UserRepository userRepository,
            ChatMessageRepository chatMessageRepository,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ChatMessage> messages = chatMessageRepository.findMessagesByUser(user);

        List<Map<String, Object>> response = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a");
        for (ChatMessage m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("sender", m.getSender().getId().equals(user.getId()) ? "me" : "admin");
            map.put("text", m.getContent());
            map.put("time", m.getCreatedAt().format(formatter));
            map.put("isRead", m.isRead());
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> payload, Authentication auth) {
        String email = auth.getName();
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        String text = payload.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message content required"));
        }

        // Find primary admin or any admin
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        User receiver = admins.isEmpty() ? null : admins.get(0);

        ChatMessage msg = new ChatMessage();
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setContent(text);
        msg.setCreatedAt(LocalDateTime.now());
        msg.setSenderRole(sender.getRole().name());
        chatMessageRepository.save(msg);

        // Notify Receiver
        if (receiver != null) {
            Notification note = new Notification();
            note.setMessage("New message from " + sender.getFullName() + ": "
                    + (text.length() > 30 ? text.substring(0, 30) + "..." : text));
            note.setTargetRole(receiver.getRole().name()); // Usually ADMIN
            note.setType("CHAT_MESSAGE");
            note.setRefId(sender.getId());
            note.setRead(false);
            note.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(note);
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/tickets")
    public ResponseEntity<?> getTickets(Authentication auth) {
        List<Map<String, Object>> tickets = new ArrayList<>();
        return ResponseEntity.ok(tickets);
    }
}
