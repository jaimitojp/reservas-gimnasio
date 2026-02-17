package com.example.Gimnasio.controller;

import com.example.Gimnasio.dto.BookingRequest;
import com.example.Gimnasio.entity.Booking;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.UserRepository;
import com.example.Gimnasio.service.BookingService;
import java.security.Principal;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }


    @GetMapping("/me")
    public List<Booking> myBookings(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        return bookingService.getBookingsByUser(user.getId());
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> createForMe(Principal principal, @RequestBody BookingRequest req) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        try {
            Booking created = bookingService.createBookingPorFecha(user.getId(), req.getResourceId(), req.getFecha(), Boolean.TRUE.equals(req.getConInstructor()));
            return org.springframework.http.ResponseEntity.ok(created);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            String reason = e.getReason() != null ? e.getReason() : "Solicitud inválida";
            return org.springframework.http.ResponseEntity.status(e.getStatusCode()).body(reason);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("Solicitud inválida");
        }
    }
}
