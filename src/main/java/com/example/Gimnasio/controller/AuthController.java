package com.example.Gimnasio.controller;

import com.example.Gimnasio.dto.AuthRequest;
import com.example.Gimnasio.dto.RegisterRequest;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.UserRepository;
import com.example.Gimnasio.service.UserService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;

    public AuthController(UserService userService, AuthenticationManager authenticationManager, UserRepository userRepository) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public org.springframework.http.ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User created = userService.register(request.getEmail(), request.getPassword(), request.getRole(), request.getUsername());
            return org.springframework.http.ResponseEntity.ok(created);
        } catch (IllegalStateException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Solicitud inválida";
            return org.springframework.http.ResponseEntity.badRequest().body(msg);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("Solicitud inválida");
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody AuthRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        Map<String, Object> res = new HashMap<>();
        res.put("authenticated", auth.isAuthenticated());
        res.put("user", request.getEmail());
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> res.put("role", u.getRole().name()));
        return res;
    }
}
