package com.assessment.platform.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AnswerRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    // For single-correct questions: list with one option ID
    // For multi-correct questions: list with multiple option IDs
    private List<Long> selectedOptionIds;
}
