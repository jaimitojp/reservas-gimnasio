package com.example.Gimnasio.service;

import com.example.Gimnasio.entity.Booking;
import com.example.Gimnasio.entity.GymResource;
import com.example.Gimnasio.entity.User;
import com.example.Gimnasio.repository.BookingRepository;
import com.example.Gimnasio.repository.GymResourceRepository;
import com.example.Gimnasio.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final GymResourceRepository gymResourceRepository;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          GymResourceRepository gymResourceRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.gymResourceRepository = gymResourceRepository;
    }

    @Transactional
    public Booking createBookingPorFecha(Long userId, Long resourceId, LocalDate fecha, Boolean conInstructor) {
        if (fecha == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha es requerida");
        }
        if (fecha.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede reservar una fecha que ya pasó");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        GymResource resource = gymResourceRepository.findById(resourceId).orElseThrow(() -> new NoSuchElementException("Recurso no encontrado"));
        boolean exists = bookingRepository.existsByUser_IdAndResource_IdAndFechaReserva(userId, resourceId, fecha);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya existe una reserva del mismo usuario para esta clase en esa fecha");
        }
        Booking b = new Booking(user, resource, fecha);
        if (Boolean.TRUE.equals(conInstructor)) {
            String elegido = b.getResource().getInstructorNombre();
            if (elegido == null || elegido.isBlank()) {
                elegido = "Instructor por asignar";
            }
            b.setConInstructor(true);
            b.setInstructorNombre(elegido);
        }
        return bookingRepository.save(b);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUser_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByResource(Long resourceId) {
        return bookingRepository.findByResource_Id(resourceId);
    }
}
