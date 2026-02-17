package com.example.Gimnasio.config;

import com.example.Gimnasio.entity.Role;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {
    @Value("${app.admin.email:}")
    private String adminEmail;
    @Value("${app.admin.password:}")
    private String adminPassword;

    @Bean
    public CommandLineRunner createAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
                return;
            }
            if (!userRepository.existsByEmail(adminEmail)) {
                String encoded = passwordEncoder.encode(adminPassword);
                User admin = new User(adminEmail, encoded, Role.ADMIN);
                userRepository.save(admin);
            }
        };
    }
}
