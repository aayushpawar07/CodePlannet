package com.assessment.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeRoleRequest {

    @NotBlank(message = "Role is required")
    private String role;
}
