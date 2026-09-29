package com.local.travel;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LocalApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void testCoverageEndpoint() throws Exception {
        mockMvc.perform(get("/v1/coverage?areaId=kyoto"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coverage.supported").value(true));
    }

    @Test
    void testNearbyPlacesEndpoint() throws Exception {
        String payload = """
                {
                    "areaId": "kyoto",
                    "origin": { "latitude": 35.0037, "longitude": 135.7772 },
                    "category": "all",
                    "radiusMeters": 2000
                }
                """;

        mockMvc.perform(post("/v1/places/nearby")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].name").value("7-Eleven ATM (Seven Bank)")); // 90m (closest)
    }

    @Test
    void testFXEndpoint() throws Exception {
        mockMvc.perform(get("/v1/fx"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("DEPENDENCY_UNAVAILABLE"));
    }

    @Test
    void testRFC9457ValidationError() throws Exception {
        String invalidPayload = """
                {
                    "areaId": "kyoto",
                    "origin": { "latitude": 195.0, "longitude": 135.7772 }
                }
                """;

        mockMvc.perform(post("/v1/places/nearby")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Content-Type", "application/problem+json"))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
