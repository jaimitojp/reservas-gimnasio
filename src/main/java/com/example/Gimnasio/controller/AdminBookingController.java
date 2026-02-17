package com.example.Gimnasio.controller;

import com.example.Gimnasio.entity.Booking;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.entity.Role;
import com.example.Gimnasio.repository.BookingRepository;
import com.example.Gimnasio.repository.UserRepository;
import com.example.Gimnasio.service.BookingService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public AdminBookingController(BookingService bookingService,
                                  BookingRepository bookingRepository,
                                  UserRepository userRepository) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Booking> list() {
        return bookingRepository.findAll();
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        Long resourceId = Long.valueOf(body.get("resourceId"));
        LocalDate fecha = LocalDate.parse(body.get("fecha"));
        boolean conInstructor = "true".equalsIgnoreCase(String.valueOf(body.get("conInstructor")));
        java.util.Optional<User> opt = userRepository.findByUsername(username);
        if (opt.isEmpty()) {
            return org.springframework.http.ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no registrado en la base de datos");
        }
        if (opt.get().getRole() == Role.ADMIN) {
            return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No se puede crear una reserva para un administrador");
        }
        try {
            Booking created = bookingService.createBookingPorFecha(opt.get().getId(), resourceId, fecha, conInstructor);
            return org.springframework.http.ResponseEntity.ok(created);
        } catch (ResponseStatusException e) {
            String reason = e.getReason() != null ? e.getReason() : "Solicitud inválida";
            return org.springframework.http.ResponseEntity.status(e.getStatusCode()).body(reason);
        } catch (NoSuchElementException e) {
            return org.springframework.http.ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage() != null ? e.getMessage() : "No encontrado");
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Solicitud inválida");
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        bookingRepository.deleteById(id);
    }
}
