package com.example.Gimnasio.controller;

import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.UserRepository;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class UserProfileController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public Map<String, Object> me(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(NoSuchElementException::new);
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("username", user.getUsername());
        dto.put("email", user.getEmail());
        dto.put("role", user.getRole() != null ? user.getRole().name() : null);
        dto.put("passwordMasked", "********");
        return dto;
    }

    @PutMapping
    public ResponseEntity<?> update(Principal principal, @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(NoSuchElementException::new);
        String newUsername = body.get("username");
        String newEmail = body.get("email");
        String newPassword = body.get("password");
        if (newUsername != null && !newUsername.isBlank()) {
            user.setUsername(newUsername.trim());
        }
        if (newEmail != null && !newEmail.isBlank()) {
            user.setEmail(newEmail.trim());
        }
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        userRepository.save(user);
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("username", user.getUsername());
        dto.put("email", user.getEmail());
        dto.put("role", user.getRole() != null ? user.getRole().name() : null);
        dto.put("passwordMasked", "********");
        return ResponseEntity.ok(dto);
    }
}
