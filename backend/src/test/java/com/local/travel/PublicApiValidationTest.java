package com.local.travel;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PublicApiValidationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;

    @Test void unconfiguredIdentityFailsClosed() throws Exception {
        mvc.perform(get("/v1/me/saved").header("Authorization", "Bearer anything"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH_REQUIRED"));
    }

    @Test void unknownAreasAndCountriesNeverReturnOtherLocations() throws Exception {
        mvc.perform(get("/v1/coverage?areaId=unknown")).andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/v1/content/ZZ/en-US")).andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/v1/briefing/ZZ")).andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/v1/places/nearby").contentType(MediaType.APPLICATION_JSON)
                .content("{\"areaId\":\"unknown\",\"origin\":{\"latitude\":0,\"longitude\":0}}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/v1/markets?areaId=unknown&q=electronics&lat=0&lon=0"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test void nearbyUsesOriginAndRadiusAndSupportsBoundedPages() throws Exception {
        mvc.perform(post("/v1/places/nearby").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"kyoto\",\"origin\":{\"latitude\":35.0045,\"longitude\":135.7785},\"radiusMeters\":100,\"limit\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").value("p-kyoto-01"))
                .andExpect(jsonPath("$.items[0].distanceMeters").value(0)).andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(post("/v1/places/nearby").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"kyoto\",\"origin\":{\"latitude\":0,\"longitude\":0},\"radiusMeters\":10000}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(post("/v1/places/nearby").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"kyoto\",\"origin\":{\"latitude\":35.0037,\"longitude\":135.7772},\"limit\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nextCursor").value("1"));
    }

    @Test void searchValidatesNestedCoordinatesAndLimit() throws Exception {
        mvc.perform(post("/v1/places/search").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"kyoto\",\"query\":\"Kyoto\",\"limit\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(post("/v1/places/search").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"kyoto\",\"query\":\"Kyoto\",\"origin\":{\"latitude\":999,\"longitude\":0}}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/v1/places/search").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"areaId\":\"kyoto\",\"query\":\"Kyoto\",\"limit\":1000}"))
                .andExpect(status().isBadRequest());
    }

    @Test void malformedInputsReturnClientErrorsInsteadOf500() throws Exception {
        mvc.perform(post("/v1/places/nearby").contentType(MediaType.APPLICATION_JSON).content("{bad"))
                .andExpect(status().isBadRequest()).andExpect(content().contentType("application/problem+json"));
        mvc.perform(get("/v1/markets?lat=garbage&lon=1")).andExpect(status().isBadRequest());
        mvc.perform(get("/v1/markets?lat=95&lon=1")).andExpect(status().isBadRequest());
        mvc.perform(get("/v1/markets?lat=1")).andExpect(status().isBadRequest());
        mvc.perform(get("/v1/markets?lat=NaN&lon=1")).andExpect(status().isBadRequest());
        mvc.perform(get("/v1/markets?limit=0")).andExpect(status().isBadRequest());
        mvc.perform(post("/v1/weather").contentType(MediaType.APPLICATION_JSON).content("{\"areaId\":\"\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/v1/places/search")).andExpect(status().isNotFound());
        mvc.perform(put("/v1/coverage")).andExpect(status().isMethodNotAllowed());
        mvc.perform(post("/v1/places/nearby").contentType(MediaType.TEXT_PLAIN).content("invalid"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test void unavailableProvidersDoNotFabricateSuccess() throws Exception {
        mvc.perform(get("/v1/packs/kyoto/manifest")).andExpect(status().isServiceUnavailable());
        mvc.perform(post("/v1/routes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"areaId\":\"london\",\"origin\":{\"latitude\":51,\"longitude\":0},\"destination\":{\"latitude\":52,\"longitude\":0},\"mode\":\"walking\"}"))
                .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("DEPENDENCY_UNAVAILABLE"));
    }

    @Test void reportsValidateAndPersistBeforeAcknowledgement() throws Exception {
        mvc.perform(post("/v1/reports").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/v1/reports").contentType(MediaType.APPLICATION_JSON)
                .content("{\"placeId\":\"p-kyoto-01\",\"issueCategory\":\"bad\",\"description\":\"wrong\"}"))
                .andExpect(status().isBadRequest());
        String json = mvc.perform(post("/v1/reports").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":\"p-kyoto-01\",\"issueCategory\":\"hours\",\"description\":\"The hours have changed.\"}"))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.status").value("RECEIVED"))
                .andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(json).get("reportId").asText();
        assertThat(jdbc.queryForObject("SELECT description FROM correction_reports WHERE report_id = ?", String.class, id))
                .isEqualTo("The hours have changed.");
    }

    @Test void oversizedAndChunkedBodiesAreRejectedBeforeParsing() throws Exception {
        String payload = "x".repeat(65_537);
        mvc.perform(post("/v1/reports").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isPayloadTooLarge());
        mvc.perform(post("/v1/reports").contentType(MediaType.APPLICATION_JSON).content(payload).with(request -> {
            request.removeHeader("Content-Length");
            request.addHeader("Transfer-Encoding", "chunked");
            return request;
        })).andExpect(status().isPayloadTooLarge());
    }

    @Test void corsOnlyAllowsConfiguredOrigins() throws Exception {
        mvc.perform(options("/v1/me/saved").header("Origin", "https://attacker.example")
                .header("Access-Control-Request-Method", "PUT")).andExpect(status().isForbidden());
        mvc.perform(options("/v1/me/saved").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "PUT").header("Access-Control-Request-Headers", "authorization,if-match"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
