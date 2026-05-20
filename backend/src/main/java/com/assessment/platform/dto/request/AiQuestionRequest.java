package com.assessment.platform.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiQuestionRequest {

    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Tech stack is required")
    private String techStack;

    @NotBlank(message = "Progress description is required")
    private String progress;

    @Min(value = 1, message = "Question count must be at least 1")
    @Max(value = 15, message = "Question count must be at most 15")
    private int questionCount;
}
