package com.local.travel.packs;

import com.local.travel.common.error.AppException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/packs")
public class PacksController {
    @GetMapping("/{area}/manifest")
    public Object getPackManifest(@PathVariable String area) {
        throw new AppException("DEPENDENCY_UNAVAILABLE", "Offline Packs Unavailable", 503,
                "No signed offline pack artifacts have been published for download.");
    }
}
