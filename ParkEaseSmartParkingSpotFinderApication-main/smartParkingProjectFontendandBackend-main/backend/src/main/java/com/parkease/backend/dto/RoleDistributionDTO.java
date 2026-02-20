package com.parkease.backend.dto;

import java.util.Map;

public class RoleDistributionDTO {
    public long admin;
    public long provider;
    public long driver;

    public RoleDistributionDTO() {
    }

    public RoleDistributionDTO(long admin, long provider, long driver) {
        this.admin = admin;
        this.provider = provider;
        this.driver = driver;
    }
}
