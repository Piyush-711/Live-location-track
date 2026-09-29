package com.local.travel.routing;

import com.local.travel.common.error.AppException;
import org.springframework.stereotype.Service;

@Service
public class RoutingService {
    public RouteResponse computeRoute(RouteRequest request) {
        throw new AppException("DEPENDENCY_UNAVAILABLE", "Routing Unavailable", 503,
                "A server routing provider has not been configured. No route can be generated.");
    }
}
