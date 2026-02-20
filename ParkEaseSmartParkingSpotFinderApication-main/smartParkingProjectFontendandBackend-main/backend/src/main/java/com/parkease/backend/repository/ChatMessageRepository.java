package com.parkease.backend.repository;

import com.parkease.backend.entity.ChatMessage;
import com.parkease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :u1 AND m.receiver = :u2) OR (m.sender = :u2 AND m.receiver = :u1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT m FROM ChatMessage m WHERE m.receiver = :user AND m.isRead = false")
    List<ChatMessage> findUnreadForUser(@Param("user") User user);

    // Get messages for provider (from any admin or to any admin)
    // For simplicity, we assume one-on-one with "System" or any Admin
    @Query("SELECT m FROM ChatMessage m WHERE m.sender = :user OR m.receiver = :user ORDER BY m.createdAt ASC")
    List<ChatMessage> findMessagesByUser(@Param("user") User user);
}
