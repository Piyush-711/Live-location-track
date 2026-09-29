package com.local.travel.personal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.local.travel.discovery.PlaceRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class PersonalPersistenceTest {
    @TempDir Path directory;

    @Test void savesTombstonesAndVersionsSurviveClosingAndReopeningDatabase() {
        String url = "jdbc:h2:file:" + directory.resolve("state").toAbsolutePath() + ";DB_CLOSE_ON_EXIT=FALSE";
        Flyway.configure().dataSource(url, "sa", "").load().migrate();
        PersonalService first = service(url);
        SavedStateResponse saved = first.setSaved("account-a", "p-kyoto-01", true, null, "*");
        SavedStateResponse deleted = first.setSaved("account-a", "p-kyoto-01", false, PersonalService.etag(saved), null);
        // DriverManagerDataSource closes each connection, forcing this instance to reopen the on-disk database.
        PersonalService restarted = service(url);
        assertThat(restarted.getSaved("account-a", "p-kyoto-01")).isEqualTo(deleted);
        assertThat(restarted.getAllSaved("account-a", 100, 0)).isEmpty();
        SavedStateResponse restored = restarted.setSaved("account-a", "p-kyoto-01", true, PersonalService.etag(deleted), null);
        assertThat(restored.storeEpoch()).isEqualTo(saved.storeEpoch());
        assertThat(restored.version()).isEqualTo("3");
    }

    private PersonalService service(String url) {
        return new PersonalService(new JdbcTemplate(new DriverManagerDataSource(url, "sa", "")), new PlaceRepository(), new ObjectMapper());
    }
}
