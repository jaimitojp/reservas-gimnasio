package com.example.Gimnasio.config;

import java.sql.Connection;
import java.sql.Statement;
import javax.sql.DataSource;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseCleanupRunner implements CommandLineRunner {
    private final DataSource dataSource;

    public DatabaseCleanupRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement st = conn.createStatement()) {
            st.executeUpdate("DROP TABLE IF EXISTS instructores");
            st.executeUpdate("DROP TABLE IF EXISTS resources");
            try {
                st.executeUpdate("ALTER TABLE reservas ADD COLUMN fecha_reserva DATE");
            } catch (Exception ignored) {}
            try {
                st.executeUpdate("UPDATE reservas SET fecha_reserva = DATE(fecha_inicio) WHERE fecha_reserva IS NULL");
            } catch (Exception ignored) {}
            try {
                st.executeUpdate("ALTER TABLE reservas DROP COLUMN fecha_inicio");
            } catch (Exception ignored) {}
            try {
                st.executeUpdate("ALTER TABLE reservas DROP COLUMN fecha_fin");
            } catch (Exception ignored) {}
            try {
                st.executeUpdate("ALTER TABLE reservas DROP COLUMN instructor_detalle");
            } catch (Exception ignored) {}
        }
    }
}
