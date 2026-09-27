package com.local.travel.packs;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/v1/packs")
public class PacksController {

    @GetMapping("/{area}/manifest")
    public ResponseEntity<Map<String, Object>> getPackManifest(@PathVariable String area) {
        return ResponseEntity.ok(Map.of(
                "packId", "pack-" + area + "-v42",
                "areaId", area,
                "version", "4.2.1-prod",
                "schemaVersion", "v8-2026",
                "hashes", Map.of(
                        "basemap.mbtiles", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                        "pois.sqlite", "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
                        "routing.osrm", "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
                ),
                "lengths", Map.of(
                        "basemap.mbtiles", 880803840L,
                        "pois.sqlite", 335544320L,
                        "routing.osrm", 272629760L
                ),
                "issuedAt", "2026-09-24T00:00:00Z",
                "expiresAt", "2026-10-24T00:00:00Z",
                "keyId", "key-local-signer-2026-09",
                "signature", "eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleS1sb2NhbC1zaWduZXItMjAyNi0wOSJ9.e30.D7S..."
        ));
    }
}
