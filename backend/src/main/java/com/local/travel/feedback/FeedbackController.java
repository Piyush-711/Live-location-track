package com.local.travel.feedback;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/reports")
public class FeedbackController {

    public record ReportRequest(
            @NotBlank String placeId,
            @NotBlank String issueCategory,
            @NotBlank @Size(max = 2000) String description,
            String reporterEmail
    ) {}

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitReport(@RequestBody ReportRequest request) {
        String reportId = "rep-" + UUID.randomUUID().toString().substring(0, 8);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(Map.of(
                        "reportId", reportId,
                        "receivedAt", Instant.now().toString(),
                        "status", "QUEUED_FOR_TWO_PERSON_REVIEW"
                ));
    }
}
