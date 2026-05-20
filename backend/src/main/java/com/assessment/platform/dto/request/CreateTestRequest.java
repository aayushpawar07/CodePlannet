package com.assessment.platform.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class CreateTestRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Time limit is required")
    @Positive(message = "Time limit must be positive")
    private Integer timeLimitMinutes;

    @NotBlank(message = "Assigned role is required")
    private String assignedRole;

    @NotNull(message = "Assigned team ID is required")
    private Long assignedTeamId;

    @NotEmpty(message = "Questions are required")
    @Valid
    private List<QuestionRequest> questions;
}
