package com.example.Gimnasio.service;

import com.example.Gimnasio.entity.Role;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(String email, String rawPassword, Role role, String username) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException("El email ya está registrado");
        }
        if (username != null && !username.isBlank() && userRepository.existsByUsername(username.trim())) {
            throw new IllegalStateException("El nombre de usuario ya está registrado");
        }
        String encoded = passwordEncoder.encode(rawPassword);
        User user = new User(email, encoded, role == null ? Role.USER : role);
        if (username != null && !username.isBlank()) {
            user.setUsername(username.trim());
        }
        return userRepository.save(user);
    }
}
