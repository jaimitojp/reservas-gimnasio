package com.example.Gimnasio.repository;

import com.example.Gimnasio.entity.Booking;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByResource_Id(Long resourceId);
    List<Booking> findByUser_Id(Long userId);
    void deleteByUser_Id(Long userId);
    boolean existsByUser_IdAndResource_IdAndFechaReserva(Long userId, Long resourceId, java.time.LocalDate fechaReserva);
}
