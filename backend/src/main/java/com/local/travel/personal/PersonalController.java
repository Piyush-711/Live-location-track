package com.local.travel.personal;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/me/saved")
public class PersonalController {

    private final PersonalService personalService;

    public PersonalController(PersonalService personalService) {
        this.personalService = personalService;
    }

    @GetMapping
    public ResponseEntity<List<SavedStateResponse>> getSavedPlaces() {
        return ResponseEntity.ok(personalService.getAllSaved());
    }

    @PutMapping("/{placeId}")
    public ResponseEntity<SavedStateResponse> savePlace(
            @PathVariable String placeId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        SavedStateResponse response = personalService.savePlace(placeId);
        String etag = "\"" + response.storeEpoch() + ":" + response.generation() + ":" + response.placeId() + ":" + response.version() + "\"";
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header(HttpHeaders.ETAG, etag)
                .body(response);
    }

    @DeleteMapping("/{placeId}")
    public ResponseEntity<SavedStateResponse> deletePlace(
            @PathVariable String placeId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        SavedStateResponse response = personalService.deletePlace(placeId);
        String etag = "\"" + response.storeEpoch() + ":" + response.generation() + ":" + response.placeId() + ":" + response.version() + "\"";
        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, etag)
                .body(response);
    }
}
