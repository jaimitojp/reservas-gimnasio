package com.example.Gimnasio.controller;

import com.example.Gimnasio.entity.Role;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.BookingRepository;
import com.example.Gimnasio.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(UserRepository userRepository,
                               BookingRepository bookingRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<User> list() {
        return userRepository.findAll();
    }

    @PostMapping
    public User create(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String raw = body.get("password");
        String roleStr = body.getOrDefault("role", "USER");
        Role role = Role.valueOf(roleStr.toUpperCase());
        User user = new User(email, passwordEncoder.encode(raw), role);
        if (body.containsKey("username")) {
            user.setUsername(body.get("username"));
        }
        return userRepository.save(user);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(NoSuchElementException::new);
        if (body.containsKey("password") && body.get("password") != null && !body.get("password").isBlank()) {
            user.setPassword(passwordEncoder.encode(body.get("password")));
        }
        if (body.containsKey("role") && body.get("role") != null && !body.get("role").isBlank()) {
            user.setRole(Role.valueOf(body.get("role").toUpperCase()));
        }
        if (body.containsKey("username")) {
            user.setUsername(body.get("username"));
        }
        return userRepository.save(user);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        bookingRepository.deleteByUser_Id(id);
        userRepository.deleteById(id);
    }
}
