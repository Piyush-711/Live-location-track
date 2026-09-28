package com.local.travel.market;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class MarketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetAllMarkets() throws Exception {
        mockMvc.perform(get("/v1/markets"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThan(10))))
                .andExpect(jsonPath("$[0].name").isNotEmpty());
    }

    @Test
    void testGetMarketsByAreaIdHyderabad() throws Exception {
        mockMvc.perform(get("/v1/markets?areaId=hyderabad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)))
                .andExpect(jsonPath("$[*].cityId", everyItem(equalTo("hyderabad"))));
    }

    @Test
    void testGetMarketsBySpecialtyElectronics() throws Exception {
        mockMvc.perform(get("/v1/markets?specialty=electronics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$[*].specialty", everyItem(equalTo("electronics"))));
    }

    @Test
    void testGetMarketsWithCoordinatesComputesDistance() throws Exception {
        mockMvc.perform(get("/v1/markets?areaId=hyderabad&lat=17.3616&lon=78.4735"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("hyd-laad-bazaar"))
                .andExpect(jsonPath("$[0].distanceMeters", lessThan(50))); // Very close to Charminar
    }

    @Test
    void testGetMarketByIdSuccess() throws Exception {
        mockMvc.perform(get("/v1/markets/hyd-laad-bazaar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("hyd-laad-bazaar"))
                .andExpect(jsonPath("$.name").value("Laad Bazaar & Charminar Market"))
                .andExpect(jsonPath("$.cityId").value("hyderabad"))
                .andExpect(jsonPath("$.specialty").value("jewelry"));
    }

    @Test
    void testGetMarketByIdNotFound() throws Exception {
        mockMvc.perform(get("/v1/markets/unknown-market-999"))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", "application/problem+json"))
                .andExpect(jsonPath("$.code").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.title").value("Market Not Found"));
    }

    @Test
    void testGetSpecialties() throws Exception {
        mockMvc.perform(get("/v1/markets/specialties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)))
                .andExpect(jsonPath("$[0].id").value("all"))
                .andExpect(jsonPath("$[1].id").value("electronics"));
    }
}
