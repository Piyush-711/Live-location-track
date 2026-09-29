package com.local.travel.feedback;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.servlet.http.HttpServletRequest;
import com.local.travel.common.error.AppException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/v1/reports")
public class FeedbackController {
    private final JdbcTemplate jdbc;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private record Window(long minute, int count) {}

    public FeedbackController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record ReportRequest(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9_:-]{1,128}") String placeId,
            @NotBlank @Pattern(regexp = "hours|closed|location|phone|safety") String issueCategory,
            @NotBlank @Size(max = 2000) String description,
            @Email @Size(max = 254) String reporterEmail
    ) {}

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitReport(@Valid @RequestBody ReportRequest request, HttpServletRequest http) {
        checkRate(http.getRemoteAddr()); // Forwarded headers are deliberately not trusted.
        String reportId = UUID.randomUUID().toString();
        String receivedAt = Instant.now().toString();
        jdbc.update("INSERT INTO correction_reports (report_id, place_id, issue_category, description, reporter_email, received_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                reportId, request.placeId(), request.issueCategory(), request.description().trim(), request.reporterEmail(), receivedAt, "RECEIVED");
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(Map.of(
                        "reportId", reportId,
                        "receivedAt", receivedAt,
                        "status", "RECEIVED"
                ));
    }

    private void checkRate(String address) {
        long minute = System.currentTimeMillis() / 60_000;
        if (windows.size() >= 4096) {
            windows.entrySet().removeIf(entry -> entry.getValue().minute() < minute);
            if (!windows.containsKey(address) && windows.size() >= 4096) throw rateLimited();
        }
        AtomicBoolean accepted = new AtomicBoolean();
        windows.compute(address, (key, existing) -> {
            Window current = existing == null || existing.minute() != minute ? new Window(minute, 0) : existing;
            if (current.count() < 10) {
                accepted.set(true);
                return new Window(minute, current.count() + 1);
            }
            return current;
        });
        if (!accepted.get()) throw rateLimited();
    }

    private static AppException rateLimited() {
        return new AppException("RATE_LIMITED", "Rate Limited", 429, "Too many correction reports. Try again in one minute.");
    }
}
